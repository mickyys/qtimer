package ports

import (
	"backend/internal/core/domain"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type EventRepository interface {
	Save(event *domain.Event) error
	FindByCode(code string) (*domain.Event, error)
	UpdateFileHash(id primitive.ObjectID, hash string) error
	DeleteEventData(eventID primitive.ObjectID) error
	SaveAllData(data []domain.EventData) (int, error)
}
