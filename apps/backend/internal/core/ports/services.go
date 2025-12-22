package ports

import (
	"mime/multipart"
	"time"
)

type UploadResult struct {
	EventID         string `json:"eventId"`
	RecordsInserted int    `json:"recordsInserted"`
	Reprocessed     bool   `json:"reprocessed"`
}

type EventService interface {
	Upload(file *multipart.FileHeader, clientHash string) (*UploadResult, error)
	GetEvents(name *string, date *time.Time, page int, limit int) (*FindEventsResult, error)
	GetParticipants(eventID string, name, chip, dorsal, category, sex, position *string, page int, limit int) (*FindParticipantsResult, error)
}
