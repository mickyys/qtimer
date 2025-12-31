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

type FindRacesResult struct {
	Races      []*domain.Race `json:"races"`
	TotalCount int64          `json:"totalCount"`
}

type EventRepository interface {
	Save(event *domain.Event) error
	FindByName(name string) (*domain.Event, error)
	FindByID(id primitive.ObjectID) (*domain.Event, error)
	Update(id primitive.ObjectID, event *domain.Event) error
	Delete(id primitive.ObjectID) error
	UpdateStatus(id primitive.ObjectID, status string) error
	UpdateFileHash(id primitive.ObjectID, hash string) error
	DeleteEventData(eventID primitive.ObjectID) error
	SaveAllData(data []domain.EventData) (int, error)
	Find(name *string, date *time.Time, page int, limit int) (*FindEventsResult, error)
	FindData(eventID primitive.ObjectID, name, chip, dorsal, category, sex, position *string, page int, limit int) (*FindParticipantsResult, error)
}

type RaceRepository interface {
	Save(race *domain.Race) error
	SaveAll(races []domain.Race) error
	FindByEventID(eventID primitive.ObjectID) ([]*domain.Race, error)
	FindByEventIDAndName(eventID primitive.ObjectID, name string) (*domain.Race, error)
	DeleteByEventID(eventID primitive.ObjectID) error
}

type CategoryRepository interface {
	Save(category *domain.Category) error
	FindOrCreate(name string) (*domain.Category, error)
	FindAll() ([]*domain.Category, error)
}
