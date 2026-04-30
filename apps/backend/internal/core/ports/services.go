package ports

import (
	"backend/internal/core/domain"
	"mime/multipart"
	"time"
)

type UploadResult struct {
	EventID         string `json:"eventId"`
	RecordsInserted int    `json:"recordsInserted"`
	Reprocessed     bool   `json:"reprocessed"`
	Message         string `json:"message"`
}

type CreateEventRequest struct {
	Name          string `json:"name"`
	Date          string `json:"date"` // Format: YYYY-MM-DD
	Time          string `json:"time"` // Format: HH:MM
	Address       string `json:"address"`
	ImageURL      string `json:"imageUrl"`
	FileName      string `json:"fileName"`
	FileExtension string `json:"fileExtension"`
}

type UpdateEventRequest struct {
	Name          string `json:"name"`
	Date          string `json:"date"` // Format: YYYY-MM-DD
	Time          string `json:"time"` // Format: HH:MM
	Address       string `json:"address"`
	ImageURL      string `json:"imageUrl"`
	FileName      string `json:"fileName"`
	FileExtension string `json:"fileExtension"`
}

type EventService interface {
	Upload(file *multipart.FileHeader, clientHash string) (*UploadResult, error)
	UploadToEvent(file *multipart.FileHeader, clientHash string, eventID string) (*UploadResult, error)
	CreateEvent(req *CreateEventRequest) (*domain.Event, error)
	GetEvent(id string) (*domain.Event, error)
	GetEventBySlug(slug string) (*domain.Event, error)
	UpdateEvent(id string, req *UpdateEventRequest) (*domain.Event, error)
	UpdateEventImage(id string, imageURL string) (*domain.Event, error)
	DeleteEvent(id string) error
	UpdateEventStatus(id string, status string) (*domain.Event, error)
	GetEvents(name *string, date *time.Time, page int, limit int) (*FindEventsResult, error)
	GetEventsWithFilter(name *string, date *time.Time, page int, limit int, includeHidden bool) (*FindEventsResult, error)
	GetParticipants(eventID string, name, chip, dorsal, category, distance, sex, position *string, page int, limit int) (*FindParticipantsResult, error)
	GetParticipantComparison(eventID string, bib string, distance string, category string) (*ComparisonResult, error)
}
