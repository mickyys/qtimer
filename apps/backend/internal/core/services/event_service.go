package services

import (
	"backend/internal/core/domain"
	"backend/internal/core/ports"
	"bufio"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type eventService struct {
	eventRepository ports.EventRepository
}

func NewEventService(eventRepository ports.EventRepository) ports.EventService {
	return &eventService{
		eventRepository: eventRepository,
	}
}

func (s *eventService) Upload(fileHeader *multipart.FileHeader, clientHash string) (*ports.UploadResult, error) {
	// 1. Validate file extension
	expectedExt := os.Getenv("RACECHECK_EXTENSION")
	if filepath.Ext(fileHeader.Filename) != expectedExt {
		return nil, ErrInvalidFileExtension
	}

	file, err := fileHeader.Open()
	if err != nil {
		return nil, fmt.Errorf("could not open file: %w", err)
	}
	defer file.Close()

	// 2. Calculate file hash
	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		return nil, fmt.Errorf("could not calculate file hash: %w", err)
	}
	calculatedHash := hex.EncodeToString(hash.Sum(nil))

	// 3. Compare hashes
	if calculatedHash != clientHash {
		return nil, ErrFileHashMismatch
	}

	// Rewind file for parsing
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return nil, fmt.Errorf("could not rewind file: %w", err)
	}

	// 4. Parse file
	scanner := bufio.NewScanner(file)
	var event *domain.Event
	var eventData []domain.EventData
	var headers []string
	reprocessed := false

	// First line: event name
	if scanner.Scan() {
		eventName := scanner.Text()
		if eventName == "" {
			return nil, errors.New("event name in header cannot be empty")
		}
		event = &domain.Event{
			Name:     eventName,
			FileHash: calculatedHash,
			Date:     time.Now(), // Or parse from file if available
			Status:   "PUBLISHED",
		}
	}

	// Process remaining lines
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, ";") {
			// Could be category or headers
			// For this implementation, we assume the line with multiple "|" is the header
			if strings.Count(line, "|") > 2 {
				headers = strings.Split(strings.TrimPrefix(line, ";"), "|")
			}
			continue
		}

		if len(headers) == 0 {
			continue // Skip data lines until headers are found
		}

		values := strings.Split(line, "|")
		if len(values) != len(headers) {
			continue // Skip malformed data lines
		}

		dataMap := make(map[string]string)
		for i, h := range headers {
			dataMap[h] = values[i]
		}
		eventData = append(eventData, domain.EventData{Data: dataMap})
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading file: %w", err)
	}

	if event == nil {
		return nil, errors.New("could not parse event information from file")
	}

	// 5. Database interaction
	existingEvent, err := s.eventRepository.FindByName(event.Name)
	if err != nil {
		return nil, fmt.Errorf("could not check for existing event: %w", err)
	}

	if existingEvent != nil {
		if existingEvent.FileHash == calculatedHash {
			return &ports.UploadResult{
				EventID:         existingEvent.ID.Hex(),
				RecordsInserted: 0,
				Reprocessed:     false,
			}, nil
		}

		reprocessed = true
		event.ID = existingEvent.ID
		if err := s.eventRepository.DeleteEventData(existingEvent.ID); err != nil {
			return nil, fmt.Errorf("could not delete old event data: %w", err)
		}
		if err := s.eventRepository.UpdateFileHash(existingEvent.ID, calculatedHash); err != nil {
			return nil, fmt.Errorf("could not update event hash: %w", err)
		}
	} else {
		event.ID = primitive.NewObjectID()
		if err := s.eventRepository.Save(event); err != nil {
			return nil, fmt.Errorf("could not save new event: %w", err)
		}
	}

	// 6. Bulk insert event data
	for i := range eventData {
		eventData[i].EventID = event.ID
	}

	recordsInserted, err := s.eventRepository.SaveAllData(eventData)
	if err != nil {
		return nil, fmt.Errorf("could not save event data: %w", err)
	}

	// 7. Return result
	return &ports.UploadResult{
		EventID:         event.ID.Hex(),
		RecordsInserted: recordsInserted,
		Reprocessed:     reprocessed,
	}, nil
}

func (s *eventService) GetEvents(name *string, date *time.Time, page int, limit int) (*ports.FindEventsResult, error) {
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}

	result, err := s.eventRepository.Find(name, date, page, limit)
	if err != nil {
		return nil, fmt.Errorf("could not get events: %w", err)
	}

	return result, nil
}

func (s *eventService) GetParticipants(eventID string, name, chip, dorsal, category, sex, position *string, page int, limit int) (*ports.FindParticipantsResult, error) {
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 200
	}

	objID, err := primitive.ObjectIDFromHex(eventID)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidObjectID, err)
	}

	result, err := s.eventRepository.FindData(objID, name, chip, dorsal, category, sex, position, page, limit)
	if err != nil {
		return nil, fmt.Errorf("could not get participants: %w", err)
	}

	return result, nil
}
