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
	eventRepository    ports.EventRepository
	raceRepository     ports.RaceRepository
	categoryRepository ports.CategoryRepository
}

func NewEventService(eventRepository ports.EventRepository, raceRepository ports.RaceRepository, categoryRepository ports.CategoryRepository) ports.EventService {
	return &eventService{
		eventRepository:    eventRepository,
		raceRepository:     raceRepository,
		categoryRepository: categoryRepository,
	}
}

func (s *eventService) CreateEvent(req *ports.CreateEventRequest) (*domain.Event, error) {
	// Validate inputs - solo el nombre es obligatorio
	if req.Name == "" {
		return nil, errors.New("event name cannot be empty")
	}

	// Parse date solo si se proporciona (format: YYYY-MM-DD)
	var parsedDate time.Time
	if req.Date != "" {
		var err error
		parsedDate, err = time.Parse("2006-01-02", req.Date)
		if err != nil {
			return nil, fmt.Errorf("invalid date format, expected YYYY-MM-DD: %w", err)
		}
	}

	// Asignar extensión por defecto si no se proporciona
	fileExtension := req.FileExtension
	if fileExtension == "" {
		fileExtension = ".racecheck"
	}

	// Create event
	event := &domain.Event{
		ID:            primitive.NewObjectID(),
		Name:          req.Name,
		Date:          parsedDate,
		Time:          req.Time,
		Address:       req.Address,
		ImageURL:      req.ImageURL,
		FileName:      req.FileName,
		FileExtension: fileExtension,
		Status:        "PUBLISHED",
		CreatedAt:     time.Now(),
		FileHash:      "", // No file hash for manually created events
	}

	// Save to database
	if err := s.eventRepository.Save(event); err != nil {
		return nil, fmt.Errorf("could not save event: %w", err)
	}

	return event, nil
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

	// 4. Parse file with new format
	result, err := s.parseRaceCheckFile(file, calculatedHash)
	if err != nil {
		return nil, err
	}

	return result, nil
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

func (s *eventService) GetEvent(id string) (*domain.Event, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidObjectID, err)
	}

	event, err := s.eventRepository.FindByID(objID)
	if err != nil {
		return nil, fmt.Errorf("could not get event: %w", err)
	}

	if event == nil {
		return nil, errors.New("event not found")
	}

	return event, nil
}

func (s *eventService) UpdateEvent(id string, req *ports.UpdateEventRequest) (*domain.Event, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidObjectID, err)
	}

	// Validate inputs
	if req.Name == "" {
		return nil, errors.New("event name cannot be empty")
	}

	// Get existing event
	existingEvent, err := s.eventRepository.FindByID(objID)
	if err != nil {
		return nil, fmt.Errorf("could not get existing event: %w", err)
	}
	if existingEvent == nil {
		return nil, errors.New("event not found")
	}

	// Parse date if provided
	var parsedDate time.Time
	if req.Date != "" {
		parsedDate, err = time.Parse("2006-01-02", req.Date)
		if err != nil {
			return nil, fmt.Errorf("invalid date format, expected YYYY-MM-DD: %w", err)
		}
	} else {
		parsedDate = existingEvent.Date
	}

	// Prepare updated event
	updatedEvent := &domain.Event{
		Name:          req.Name,
		Date:          parsedDate,
		Time:          req.Time,
		Address:       req.Address,
		ImageURL:      req.ImageURL,
		FileName:      req.FileName,
		FileExtension: req.FileExtension,
		Status:        existingEvent.Status, // Keep existing status
	}

	// Set default file extension if empty
	if updatedEvent.FileExtension == "" {
		updatedEvent.FileExtension = ".racecheck"
	}

	// Update in database
	if err := s.eventRepository.Update(objID, updatedEvent); err != nil {
		return nil, fmt.Errorf("could not update event: %w", err)
	}

	// Return updated event with original fields
	updatedEvent.ID = existingEvent.ID
	updatedEvent.CreatedAt = existingEvent.CreatedAt
	updatedEvent.FileHash = existingEvent.FileHash

	return updatedEvent, nil
}

func (s *eventService) DeleteEvent(id string) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return fmt.Errorf("%w: %v", ErrInvalidObjectID, err)
	}

	// Check if event exists
	event, err := s.eventRepository.FindByID(objID)
	if err != nil {
		return fmt.Errorf("could not check if event exists: %w", err)
	}
	if event == nil {
		return errors.New("event not found")
	}

	// Delete event and associated data
	if err := s.eventRepository.Delete(objID); err != nil {
		return fmt.Errorf("could not delete event: %w", err)
	}

	return nil
}

func (s *eventService) UpdateEventStatus(id string, status string) (*domain.Event, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidObjectID, err)
	}

	// Validate status
	validStatuses := []string{"PUBLISHED", "HIDDEN", "DRAFT"}
	isValid := false
	for _, validStatus := range validStatuses {
		if status == validStatus {
			isValid = true
			break
		}
	}
	if !isValid {
		return nil, errors.New("invalid status. Valid options are: PUBLISHED, HIDDEN, DRAFT")
	}

	// Check if event exists
	event, err := s.eventRepository.FindByID(objID)
	if err != nil {
		return nil, fmt.Errorf("could not get event: %w", err)
	}
	if event == nil {
		return nil, errors.New("event not found")
	}

	// Update status
	if err := s.eventRepository.UpdateStatus(objID, status); err != nil {
		return nil, fmt.Errorf("could not update event status: %w", err)
	}

	// Return updated event
	event.Status = status
	return event, nil
}

func (s *eventService) GetRaces(eventID string) ([]*domain.Race, error) {
	objID, err := primitive.ObjectIDFromHex(eventID)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidObjectID, err)
	}

	races, err := s.raceRepository.FindByEventID(objID)
	if err != nil {
		return nil, fmt.Errorf("could not get races: %w", err)
	}

	return races, nil
}

func (s *eventService) parseRaceCheckFile(file io.ReadSeeker, fileHash string) (*ports.UploadResult, error) {
	scanner := bufio.NewScanner(file)
	var event *domain.Event
	var allEventData []domain.EventData
	var allRaces []domain.Race
	var headers []string
	var currentRace *domain.Race
	reprocessed := false

	// First line: event name
	if scanner.Scan() {
		eventName := scanner.Text()
		if eventName == "" {
			return nil, errors.New("event name in header cannot be empty")
		}
		event = &domain.Event{
			Name:     eventName,
			FileHash: fileHash,
			Date:     time.Now(),
			Status:   "PUBLISHED",
		}
	}

	raceOrder := 0

	// Process remaining lines
	for scanner.Scan() {
		line := scanner.Text()

		// Check if it's a race line (format: ;1|CAD 3G)
		if strings.HasPrefix(line, ";") && strings.Contains(line, "|") && !strings.HasPrefix(line, ";SEXO") {
			parts := strings.Split(strings.TrimPrefix(line, ";"), "|")
			if len(parts) >= 2 {
				raceOrder++
				raceName := parts[1] // Ej: "CAD 3G"

				// Save previous race if exists
				if currentRace != nil {
					allRaces = append(allRaces, *currentRace)
				}

				currentRace = &domain.Race{
					Name:  raceName,
					Order: raceOrder,
				}
				headers = nil // Reset headers for new race
				continue
			}
		}

		// Check if it's a header line (format: ;SEXO|NOMBRE|CHIP|...)
		if strings.HasPrefix(line, ";SEXO|") {
			headers = strings.Split(strings.TrimPrefix(line, ";"), "|")
			continue
		}

		// Skip empty lines or lines without headers/current race
		if len(headers) == 0 || currentRace == nil {
			continue
		}

		// Parse participant data
		values := strings.Split(line, "|")
		if len(values) != len(headers) {
			continue // Skip malformed data lines
		}

		dataMap := make(map[string]string)
		for i, h := range headers {
			dataMap[h] = values[i]
		}

		// Extract category from the data and set it in the race if not set
		if categoria, ok := dataMap["CATEGORIA"]; ok && currentRace.Category == "" {
			currentRace.Category = categoria
		}

		// Add event data
		eventData := domain.EventData{Data: dataMap}
		allEventData = append(allEventData, eventData)
	}

	// Don't forget to add the last race
	if currentRace != nil {
		allRaces = append(allRaces, *currentRace)
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading file: %w", err)
	}

	if event == nil {
		return nil, errors.New("could not parse event information from file")
	}

	// Check for existing event
	existingEvent, err := s.eventRepository.FindByName(event.Name)
	if err != nil {
		return nil, fmt.Errorf("could not check for existing event: %w", err)
	}

	if existingEvent != nil {
		if existingEvent.FileHash == fileHash {
			return &ports.UploadResult{
				EventID:         existingEvent.ID.Hex(),
				RecordsInserted: 0,
				Reprocessed:     false,
			}, nil
		}

		reprocessed = true
		event.ID = existingEvent.ID

		// Delete old data and races
		if err := s.eventRepository.DeleteEventData(existingEvent.ID); err != nil {
			return nil, fmt.Errorf("could not delete old event data: %w", err)
		}
		if err := s.raceRepository.DeleteByEventID(existingEvent.ID); err != nil {
			return nil, fmt.Errorf("could not delete old races: %w", err)
		}
		if err := s.eventRepository.UpdateFileHash(existingEvent.ID, fileHash); err != nil {
			return nil, fmt.Errorf("could not update event hash: %w", err)
		}
	} else {
		event.ID = primitive.NewObjectID()
		if err := s.eventRepository.Save(event); err != nil {
			return nil, fmt.Errorf("could not save new event: %w", err)
		}
	}

	// Process races to ensure categories exist and assign IDs
	raceNameToID := make(map[string]primitive.ObjectID)

	for i := range allRaces {
		allRaces[i].ID = primitive.NewObjectID()
		allRaces[i].EventID = event.ID

		// Ensure category exists
		if allRaces[i].Category != "" {
			_, err := s.categoryRepository.FindOrCreate(allRaces[i].Category)
			if err != nil {
				return nil, fmt.Errorf("could not ensure category exists: %w", err)
			}
		}

		raceNameToID[allRaces[i].Name] = allRaces[i].ID
	}

	// Save races
	if len(allRaces) > 0 {
		if err := s.raceRepository.SaveAll(allRaces); err != nil {
			return nil, fmt.Errorf("could not save races: %w", err)
		}
	}

	// Associate event data with races and save
	for i := range allEventData {
		allEventData[i].EventID = event.ID

		// Try to find matching race by modalidad
		if modalidad, ok := allEventData[i].Data["MODALIDAD"]; ok {
			if raceID, found := raceNameToID[modalidad]; found {
				allEventData[i].RaceID = raceID
			}
		}
	}

	var recordsInserted int
	if len(allEventData) > 0 {
		recordsInserted, err = s.eventRepository.SaveAllData(allEventData)
		if err != nil {
			return nil, fmt.Errorf("could not save event data: %w", err)
		}
	}

	return &ports.UploadResult{
		EventID:         event.ID.Hex(),
		RecordsInserted: recordsInserted,
		Reprocessed:     reprocessed,
	}, nil
}

func (s *eventService) UploadToEvent(fileHeader *multipart.FileHeader, clientHash string, eventID string) (*ports.UploadResult, error) {
	// 1. Validate eventID
	objID, err := primitive.ObjectIDFromHex(eventID)
	if err != nil {
		return nil, fmt.Errorf("invalid event ID: %w", err)
	}

	// 2. Check if event exists
	existingEvent, err := s.eventRepository.FindByID(objID)
	if err != nil {
		return nil, fmt.Errorf("could not find event: %w", err)
	}
	if existingEvent == nil {
		return nil, fmt.Errorf("event not found")
	}

	// 3. Validate file extension
	expectedExt := os.Getenv("RACECHECK_EXTENSION")
	if filepath.Ext(fileHeader.Filename) != expectedExt {
		return nil, ErrInvalidFileExtension
	}

	file, err := fileHeader.Open()
	if err != nil {
		return nil, fmt.Errorf("could not open file: %w", err)
	}
	defer file.Close()

	// 4. Calculate file hash
	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		return nil, fmt.Errorf("could not calculate file hash: %w", err)
	}
	calculatedHash := hex.EncodeToString(hash.Sum(nil))

	// 5. Compare hashes
	if calculatedHash != clientHash {
		return nil, ErrFileHashMismatch
	}

	// Check if file is the same as already uploaded
	if existingEvent.FileHash == calculatedHash {
		return &ports.UploadResult{
			EventID:         existingEvent.ID.Hex(),
			RecordsInserted: 0,
			Reprocessed:     false,
		}, nil
	}

	// Rewind file for parsing
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return nil, fmt.Errorf("could not rewind file: %w", err)
	}

	// 6. Parse file with existing event
	result, err := s.parseRaceCheckFileForEvent(file, calculatedHash, existingEvent)
	if err != nil {
		return nil, err
	}

	return result, nil
}

func (s *eventService) parseRaceCheckFileForEvent(file io.ReadSeeker, fileHash string, event *domain.Event) (*ports.UploadResult, error) {
	scanner := bufio.NewScanner(file)
	var allEventData []domain.EventData
	var allRaces []domain.Race
	var headers []string
	var currentRace *domain.Race

	// Skip first line (event name) since we're using existing event
	if scanner.Scan() {
		// Just skip the event name line
	}

	raceOrder := 0

	// Process remaining lines
	for scanner.Scan() {
		line := scanner.Text()

		// Check if it's a race line (format: ;1|CAD 3G)
		if strings.HasPrefix(line, ";") && strings.Contains(line, "|") && !strings.HasPrefix(line, ";SEXO") {
			parts := strings.Split(strings.TrimPrefix(line, ";"), "|")
			if len(parts) >= 2 {
				raceOrder++
				raceName := parts[1] // Ej: "CAD 3G"

				// Save previous race if exists
				if currentRace != nil {
					allRaces = append(allRaces, *currentRace)
				}

				currentRace = &domain.Race{
					Name:  raceName,
					Order: raceOrder,
				}
				headers = nil // Reset headers for new race
				continue
			}
		}

		// Check if it's a header line (format: ;SEXO|NOMBRE|CHIP|...)
		if strings.HasPrefix(line, ";SEXO|") {
			headers = strings.Split(strings.TrimPrefix(line, ";"), "|")
			continue
		}

		// Skip empty lines or lines without headers/current race
		if len(headers) == 0 || currentRace == nil {
			continue
		}

		// Parse participant data
		values := strings.Split(line, "|")
		if len(values) != len(headers) {
			continue // Skip malformed data lines
		}

		dataMap := make(map[string]string)
		for i, h := range headers {
			dataMap[h] = values[i]
		}

		// Extract category from the data and set it in the race if not set
		if categoria, ok := dataMap["CATEGORIA"]; ok && currentRace.Category == "" {
			currentRace.Category = categoria
		}

		// Add event data
		eventData := domain.EventData{Data: dataMap}
		allEventData = append(allEventData, eventData)
	}

	// Don't forget to add the last race
	if currentRace != nil {
		allRaces = append(allRaces, *currentRace)
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading file: %w", err)
	}

	// Delete old data and races
	if err := s.eventRepository.DeleteEventData(event.ID); err != nil {
		return nil, fmt.Errorf("could not delete old event data: %w", err)
	}
	if err := s.raceRepository.DeleteByEventID(event.ID); err != nil {
		return nil, fmt.Errorf("could not delete old races: %w", err)
	}
	if err := s.eventRepository.UpdateFileHash(event.ID, fileHash); err != nil {
		return nil, fmt.Errorf("could not update event hash: %w", err)
	}

	// Process races to ensure categories exist and assign IDs
	raceNameToID := make(map[string]primitive.ObjectID)

	for i := range allRaces {
		allRaces[i].ID = primitive.NewObjectID()
		allRaces[i].EventID = event.ID

		// Ensure category exists
		if allRaces[i].Category != "" {
			_, err := s.categoryRepository.FindOrCreate(allRaces[i].Category)
			if err != nil {
				return nil, fmt.Errorf("could not ensure category exists: %w", err)
			}
		}

		raceNameToID[allRaces[i].Name] = allRaces[i].ID
	}

	// Save races
	if len(allRaces) > 0 {
		if err := s.raceRepository.SaveAll(allRaces); err != nil {
			return nil, fmt.Errorf("could not save races: %w", err)
		}
	}

	// Associate event data with races and save
	for i := range allEventData {
		allEventData[i].EventID = event.ID

		// Try to find matching race by modalidad
		if modalidad, ok := allEventData[i].Data["MODALIDAD"]; ok {
			if raceID, found := raceNameToID[modalidad]; found {
				allEventData[i].RaceID = raceID
			}
		}
	}

	var recordsInserted int
	if len(allEventData) > 0 {
		var err error
		recordsInserted, err = s.eventRepository.SaveAllData(allEventData)
		if err != nil {
			return nil, fmt.Errorf("could not save event data: %w", err)
		}

		return &ports.UploadResult{
			EventID:         event.ID.Hex(),
			RecordsInserted: recordsInserted,
			Reprocessed:     true,
		}, nil
	}

	return &ports.UploadResult{
		EventID:         event.ID.Hex(),
		RecordsInserted: 0,
		Reprocessed:     true,
	}, nil
}
