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

type ComparisonResult struct {
	FirstPlace           *domain.EventData   `json:"firstPlace"`
	PreviousParticipants []*domain.EventData `json:"previousParticipants"`
}

type EventRepository interface {
	Save(event *domain.Event) error
	FindByName(name string) (*domain.Event, error)
	FindBySlug(slug string) (*domain.Event, error)
	FindByID(id primitive.ObjectID) (*domain.Event, error)
	Update(id primitive.ObjectID, event *domain.Event) error
	Delete(id primitive.ObjectID) error
	UpdateStatus(id primitive.ObjectID, status string) error
	UpdateFileHash(id primitive.ObjectID, hash string) error
	UpdateFileStats(id primitive.ObjectID, hash string, uniqueModalities []string, uniqueCategories []string, recordsCount int) error
	DeleteEventData(eventID primitive.ObjectID) error
	SaveAllData(data []domain.EventData) (int, error)
	Find(name *string, date *time.Time, page int, limit int) (*FindEventsResult, error)
	FindData(eventID primitive.ObjectID, name, chip, dorsal, category, distance, sex, position *string, page int, limit int) (*FindParticipantsResult, error)
	GetParticipantComparison(eventID primitive.ObjectID, bib string, distance string) (*ComparisonResult, error)
}
