package services

import (
	"backend/internal/core/domain"
	"backend/internal/core/ports"
)

type userService struct {
	userRepository ports.UserRepository
}

func NewUserService(userRepository ports.UserRepository) *userService {
	return &userService{
		userRepository: userRepository,
	}
}

func (s *userService) Register(email, name string) (*domain.User, error) {
	// TODO: Implement
	return nil, nil
}

func (s *userService) Login(email string) (*domain.User, error) {
	// TODO: Implement
	return nil, nil
}
