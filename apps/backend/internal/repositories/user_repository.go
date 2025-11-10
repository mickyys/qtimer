package repositories

import (
	"backend/internal/core/domain"
	"github.com/jackc/pgx/v4/pgxpool"
)

type userRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) *userRepository {
	return &userRepository{
		db: db,
	}
}

func (r *userRepository) Save(user *domain.User) error {
	// TODO: Implement
	return nil
}

func (r *userRepository) FindByEmail(email string) (*domain.User, error) {
	// TODO: Implement
	return nil, nil
}
