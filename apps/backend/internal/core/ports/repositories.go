package ports

import (
	"backend/internal/core/domain"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type FindEventsResult struct {
	Events     []*domain.Event `json:"events"`
	TotalCount int64           `json:"totalCount"`
}

type FindParticipantsResult struct {
	Participants []*domain.EventData `json:"participants"`
	TotalCount   int64               `json:"totalCount"`
}

type EventRepository interface {
	Save(event *domain.Event) error
	FindByCode(code string) (*domain.Event, error)
	UpdateFileHash(id primitive.ObjectID, hash string) error
	DeleteEventData(eventID primitive.ObjectID) error
	SaveAllData(data []domain.EventData) (int, error)
	Find(name *string, date *time.Time, page int, limit int) (*FindEventsResult, error)
	FindData(eventID primitive.ObjectID, name, chip, dorsal, category, sex, position *string, page int, limit int) (*FindParticipantsResult, error)
}
