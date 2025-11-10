package ports

import "backend/internal/core/domain"

type UserService interface {
	Register(email, name string) (*domain.User, error)
	Login(email string) (*domain.User, error)
}

type EventService interface {
	Create(name string) (*domain.Event, error)
	GetAll() ([]*domain.Event, error)
	GetByID(id int64) (*domain.Event, error)
}

type ResultService interface {
	Upload(eventID int64, file []byte) error
	GetByEventID(eventID int64) ([]*domain.Result, error)
}
