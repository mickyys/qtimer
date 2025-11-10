package repositories

import (
	"backend/internal/core/domain"
	"github.com/jackc/pgx/v4/pgxpool"
)

type resultRepository struct {
	db *pgxpool.Pool
}

func NewResultRepository(db *pgxpool.Pool) *resultRepository {
	return &resultRepository{
		db: db,
	}
}

func (r *resultRepository) Save(result *domain.Result) error {
	// TODO: Implement
	return nil
}

func (r *resultRepository) FindByEventID(eventID int64) ([]*domain.Result, error) {
	// TODO: Implement
	return nil, nil
}
