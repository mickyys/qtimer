package repositories

import (
	"backend/internal/core/domain"
	"github.com/jackc/pgx/v4/pgxpool"
)

type runnerRepository struct {
	db *pgxpool.Pool
}

func NewRunnerRepository(db *pgxpool.Pool) *runnerRepository {
	return &runnerRepository{
		db: db,
	}
}

func (r *runnerRepository) Save(runner *domain.Runner) error {
	// TODO: Implement
	return nil
}
