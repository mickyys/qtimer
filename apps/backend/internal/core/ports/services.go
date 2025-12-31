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
}

type CreateEventRequest struct {
	Name     string `json:"name"`
	Date     string `json:"date"` // Format: YYYY-MM-DD
	Time     string `json:"time"` // Format: HH:MM
	Address  string `json:"address"`
	ImageURL string `json:"imageUrl"`
}

type EventService interface {
	Upload(file *multipart.FileHeader, clientHash string) (*UploadResult, error)
	CreateEvent(req *CreateEventRequest) (*domain.Event, error)
	GetEvents(name *string, date *time.Time, page int, limit int) (*FindEventsResult, error)
	GetParticipants(eventID string, name, chip, dorsal, category, sex, position *string, page int, limit int) (*FindParticipantsResult, error)
}
