package ports

import (
	"mime/multipart"
)

type UploadResult struct {
	EventID         string `json:"eventId"`
	RecordsInserted int    `json:"recordsInserted"`
	Reprocessed     bool   `json:"reprocessed"`
}

type EventService interface {
	Upload(file *multipart.FileHeader, clientHash string) (*UploadResult, error)
}
