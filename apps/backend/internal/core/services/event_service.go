package services

import (
	"backend/internal/core/domain"
	"backend/internal/core/ports"
)

type eventService struct {
	eventRepository ports.EventRepository
}

func NewEventService(eventRepository ports.EventRepository) *eventService {
	return &eventService{
		eventRepository: eventRepository,
	}
}

func (s *eventService) Create(name string) (*domain.Event, error) {
	// TODO: Implement
	return nil, nil
}

func (s *eventService) GetAll() ([]*domain.Event, error) {
	// TODO: Implement
	return nil, nil
}

func (s *eventService) GetByID(id int64) (*domain.Event, error) {
	// TODO: Implement
	return nil, nil
}
