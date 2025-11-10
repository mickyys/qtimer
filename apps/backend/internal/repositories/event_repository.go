package repositories

import (
	"backend/internal/core/domain"
	"github.com/jackc/pgx/v4/pgxpool"
)

type eventRepository struct {
	db *pgxpool.Pool
}

func NewEventRepository(db *pgxpool.Pool) *eventRepository {
	return &eventRepository{
		db: db,
	}
}

func (r *eventRepository) Save(event *domain.Event) error {
	// TODO: Implement
	return nil
}

func (r *eventRepository) FindAll() ([]*domain.Event, error) {
	// TODO: Implement
	return nil, nil
}

func (r *eventRepository) FindByID(id int64) (*domain.Event, error) {
	// TODO: Implement
	return nil, nil
}
