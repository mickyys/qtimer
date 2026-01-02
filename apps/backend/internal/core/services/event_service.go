package services

import (
	"backend/internal/core/domain"
	"backend/internal/core/ports"
	"backend/internal/utils"
	"bufio"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
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

// parseDataValue convierte un valor string al tipo apropiado basado en su contenido
// fieldName se usa para identificar campos categóricos que no deben ser parseados como booleanos
func parseDataValue(value string, fieldName string) interface{} {
	// Si el valor está vacío, retornar string vacío
	if value == "" {
		return ""
	}

	// Campos categóricos que siempre deben permanecer como strings
	categoricalFields := map[string]bool{
		"SEXO":      true,
		"NOMBRE":    true,
		"CHIP":      true,
		"DORSAL":    true,
		"MODALIDAD": true,
		"CATEGORIA": true,
		"RITMO":     true,
	}

	// Si es un campo categórico, mantener como string
	if categoricalFields[fieldName] {
		return value
	}

	// Intentar parsear como entero
	if intVal, err := strconv.Atoi(value); err == nil {
		return intVal
	}

	// Intentar parsear como float
	if floatVal, err := strconv.ParseFloat(value, 64); err == nil {
		return floatVal
	}

	// Intentar parsear como tiempo (formato HH:MM:SS o MM:SS)
	if matched, _ := regexp.MatchString(`^\d{1,2}:\d{2}(:\d{2})?$`, value); matched {
		return value // Mantener formato de tiempo como string
	}

	// Intentar parsear como fecha (varios formatos comunes)
	dateFormats := []string{
		"2006-01-02",          // YYYY-MM-DD
		"02/01/2006",          // DD/MM/YYYY
		"01/02/2006",          // MM/DD/YYYY
		"2006/01/02",          // YYYY/MM/DD
		"02-01-2006",          // DD-MM-YYYY
		"01-02-2006",          // MM-DD-YYYY
		"2006-01-02 15:04:05", // YYYY-MM-DD HH:MM:SS
		"02/01/2006 15:04:05", // DD/MM/YYYY HH:MM:SS
	}

	for _, format := range dateFormats {
		if dateVal, err := time.Parse(format, value); err == nil {
			return dateVal
		}
	}

	// Intentar parsear como booleano (solo para campos no categóricos)
	if boolVal, err := strconv.ParseBool(value); err == nil {
		return boolVal
	}

	// Si no coincide con ningún tipo específico, retornar como string
	return value
}

// validateAndConvertData toma un map[string]string y lo convierte a map[string]interface{}
// con los tipos apropiados
func validateAndConvertData(rawData map[string]string) map[string]interface{} {
	convertedData := make(map[string]interface{})

	for key, value := range rawData {
		convertedData[key] = parseDataValue(value, key)
	}

	return convertedData
}

func (s *eventService) CreateEvent(req *ports.CreateEventRequest) (*domain.Event, error) {
	// Validate inputs - solo el nombre es obligatorio
	if req.Name == "" {
		return nil, errors.New("event name cannot be empty")
	}

	// Generate slug from event name
	slug := utils.GenerateSlug(req.Name)

	// Validate that the generated slug is valid
	if slug == "" {
		return nil, errors.New("event name must contain at least one valid character (letters or numbers)")
	}

	// Check if slug is valid format
	if !utils.IsValidSlug(slug) {
		return nil, fmt.Errorf("invalid slug generated from event name: %s. Please use only letters, numbers, and spaces", req.Name)
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

	// Check if slug already exists and make it unique if needed
	uniqueSlug := slug
	counter := 1
	for {
		existingEvent, err := s.eventRepository.FindBySlug(uniqueSlug)
		if err != nil {
			return nil, fmt.Errorf("could not check slug uniqueness: %w", err)
		}
		if existingEvent == nil {
			break // Slug is unique
		}
		// Generate a new slug with counter
		uniqueSlug = fmt.Sprintf("%s-%d", slug, counter)
		counter++
	}

	// Create event
	event := &domain.Event{
		ID:            primitive.NewObjectID(),
		Name:          req.Name,
		Slug:          uniqueSlug,
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

func (s *eventService) GetParticipants(eventID string, name, chip, dorsal, category, distance, sex, position *string, page int, limit int) (*ports.FindParticipantsResult, error) {
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

	result, err := s.eventRepository.FindData(objID, name, chip, dorsal, category, distance, sex, position, page, limit)
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

func (s *eventService) GetEventBySlug(slug string) (*domain.Event, error) {
	event, err := s.eventRepository.FindBySlug(slug)
	if err != nil {
		return nil, fmt.Errorf("could not get event by slug: %w", err)
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

func (s *eventService) parseRaceCheckFile(file io.ReadSeeker, fileHash string) (*ports.UploadResult, error) {
	scanner := bufio.NewScanner(file)
	var event *domain.Event
	var allEventData []domain.EventData
	var headers []string
	var reprocessed bool
	var lineNum int = 0
	var recordsSkipped int = 0

	// Maps para recopilar valores únicos
	uniqueModalities := make(map[string]bool)
	uniqueCategories := make(map[string]bool)

	// First line: event name
	if scanner.Scan() {
		lineNum++
		eventName := scanner.Text()
		if eventName == "" {
			return nil, errors.New("event name in header cannot be empty")
		}

		// Generate slug from event name
		slug := utils.GenerateSlug(eventName)

		event = &domain.Event{
			Name:     eventName,
			Slug:     slug,
			FileHash: fileHash,
			Date:     time.Now(),
			Status:   "PUBLISHED",
		}
	}

	// Process remaining lines
	for scanner.Scan() {
		lineNum++
		line := scanner.Text()

		// Check if it's a race line (format: ;1|CAD 3G) - skip it
		if strings.HasPrefix(line, ";") && strings.Contains(line, "|") && !strings.HasPrefix(line, ";SEXO") {
			parts := strings.Split(strings.TrimPrefix(line, ";"), "|")
			if len(parts) >= 2 {
				headers = nil // Reset headers for new race
				continue
			}
		}

		// Check if it's a header line (format: ;SEXO|NOMBRE|CHIP|...)
		if strings.HasPrefix(line, ";SEXO|") {
			headers = strings.Split(strings.TrimPrefix(line, ";"), "|")
			continue
		}

		// Skip empty lines or lines without headers
		if len(headers) == 0 {
			continue
		}

		// Parse participant data
		values := strings.Split(line, "|")
		if len(values) != len(headers) {
			recordsSkipped++
			continue // Skip malformed data lines
		}

		dataMap := make(map[string]string)
		for i, h := range headers {
			dataMap[h] = values[i]
		}

		// Recopilar valores únicos para filtros
		if modalidad, ok := dataMap["MODALIDAD"]; ok && modalidad != "" {
			uniqueModalities[modalidad] = true
		}
		if categoria, ok := dataMap["CATEGORIA"]; ok && categoria != "" {
			uniqueCategories[categoria] = true
		}

		// Add event data with type validation and conversion
		convertedData := validateAndConvertData(dataMap)
		eventData := domain.EventData{Data: convertedData}
		allEventData = append(allEventData, eventData)
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading file: %w", err)
	}

	if event == nil {
		return nil, errors.New("could not parse event information from file")
	}

	// Log parsing information
	fmt.Printf("[DEBUG] Parsed file: %d total lines, %d records extracted, %d records skipped\n", lineNum, len(allEventData), recordsSkipped)
	if len(allEventData) == 0 {
		fmt.Printf("[DEBUG] Warning: No records extracted. Event name: %s\n", event.Name)
	}

	// Convertir mapas de valores únicos a slices
	modalitiesSlice := make([]string, 0, len(uniqueModalities))
	for modality := range uniqueModalities {
		modalitiesSlice = append(modalitiesSlice, modality)
	}
	sort.Strings(modalitiesSlice)

	categoriesSlice := make([]string, 0, len(uniqueCategories))
	for category := range uniqueCategories {
		categoriesSlice = append(categoriesSlice, category)
	}
	sort.Strings(categoriesSlice)

	// Asignar valores únicos y cantidad de registros al evento
	event.UniqueModalities = modalitiesSlice
	event.UniqueCategories = categoriesSlice
	event.RecordsCount = len(allEventData)

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

		// Delete old data
		if err := s.eventRepository.DeleteEventData(existingEvent.ID); err != nil {
			return nil, fmt.Errorf("could not delete old event data: %w", err)
		}
		if err := s.eventRepository.UpdateFileStats(existingEvent.ID, fileHash, modalitiesSlice, categoriesSlice, len(allEventData)); err != nil {
			return nil, fmt.Errorf("could not update event stats: %w", err)
		}
	} else {
		event.ID = primitive.NewObjectID()
		if err := s.eventRepository.Save(event); err != nil {
			return nil, fmt.Errorf("could not save new event: %w", err)
		}
	}

	// Process and save event data
	for i := range allEventData {
		allEventData[i].EventID = event.ID
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
	var headers []string
	var lineNum int = 0
	var recordsSkipped int = 0

	// Maps para recopilar valores únicos
	uniqueModalities := make(map[string]bool)
	uniqueCategories := make(map[string]bool)

	// Skip first line (event name) since we're using existing event
	if scanner.Scan() {
		lineNum++
		// Just skip the event name line
	}

	// Process remaining lines
	for scanner.Scan() {
		lineNum++
		line := scanner.Text()

		// Check if it's a race line (format: ;1|CAD 3G) - skip it
		if strings.HasPrefix(line, ";") && strings.Contains(line, "|") && !strings.HasPrefix(line, ";SEXO") {
			parts := strings.Split(strings.TrimPrefix(line, ";"), "|")
			if len(parts) >= 2 {
				headers = nil // Reset headers for new race
				continue
			}
		}

		// Check if it's a header line (format: ;SEXO|NOMBRE|CHIP|...)
		if strings.HasPrefix(line, ";SEXO|") {
			headers = strings.Split(strings.TrimPrefix(line, ";"), "|")
			continue
		}

		// Skip empty lines or lines without headers
		if len(headers) == 0 {
			continue
		}

		// Parse participant data
		values := strings.Split(line, "|")
		if len(values) != len(headers) {
			recordsSkipped++
			continue // Skip malformed data lines
		}

		dataMap := make(map[string]string)
		for i, h := range headers {
			dataMap[h] = values[i]
		}

		// Recopilar valores únicos para filtros
		if modalidad, ok := dataMap["MODALIDAD"]; ok && modalidad != "" {
			uniqueModalities[modalidad] = true
		}
		if categoria, ok := dataMap["CATEGORIA"]; ok && categoria != "" {
			uniqueCategories[categoria] = true
		}

		// Add event data with type validation and conversion
		convertedData := validateAndConvertData(dataMap)
		eventData := domain.EventData{Data: convertedData}
		allEventData = append(allEventData, eventData)
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading file: %w", err)
	}

	// Convertir mapas de valores únicos a slices
	modalitiesSlice := make([]string, 0, len(uniqueModalities))
	for modality := range uniqueModalities {
		modalitiesSlice = append(modalitiesSlice, modality)
	}
	sort.Strings(modalitiesSlice)

	categoriesSlice := make([]string, 0, len(uniqueCategories))
	for category := range uniqueCategories {
		categoriesSlice = append(categoriesSlice, category)
	}
	sort.Strings(categoriesSlice)

	// Log parsing information
	fmt.Printf("[DEBUG] Parsed file for event '%s': %d total lines, %d records extracted, %d records skipped\n", event.Name, lineNum, len(allEventData), recordsSkipped)
	if len(allEventData) == 0 {
		fmt.Printf("[DEBUG] Warning: No records extracted for event '%s'\n", event.Name)
	}

	// Asignar valores únicos y cantidad de registros al evento
	event.UniqueModalities = modalitiesSlice
	event.UniqueCategories = categoriesSlice
	event.RecordsCount = len(allEventData)

	// Delete old data
	if err := s.eventRepository.DeleteEventData(event.ID); err != nil {
		return nil, fmt.Errorf("could not delete old event data: %w", err)
	}
	if err := s.eventRepository.UpdateFileStats(event.ID, fileHash, modalitiesSlice, categoriesSlice, len(allEventData)); err != nil {
		return nil, fmt.Errorf("could not update event stats: %w", err)
	}

	// Process and save event data
	for i := range allEventData {
		allEventData[i].EventID = event.ID
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

// GetParticipantComparison obtiene el 1er lugar y los 5 participantes anteriores
func (s *eventService) GetParticipantComparison(eventID string, bib string, distance string, category string) (*ports.ComparisonResult, error) {
	objID, err := primitive.ObjectIDFromHex(eventID)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidObjectID, err)
	}

	result, err := s.eventRepository.GetParticipantComparison(objID, bib, distance, category)
	if err != nil {
		return nil, fmt.Errorf("could not get participant comparison: %w", err)
	}

	return result, nil
}
