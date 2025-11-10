package ports

import "backend/internal/core/domain"

type UserRepository interface {
	Save(user *domain.User) error
	FindByEmail(email string) (*domain.User, error)
}

type EventRepository interface {
	Save(event *domain.Event) error
	FindAll() ([]*domain.Event, error)
	FindByID(id int64) (*domain.Event, error)
}

type RunnerRepository interface {
	Save(runner *domain.Runner) error
}

type ResultRepository interface {
	Save(result *domain.Result) error
	FindByEventID(eventID int64) ([]*domain.Result, error)
}
