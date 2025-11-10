package services

import (
	"backend/internal/core/domain"
	"backend/internal/core/ports"
)

type resultService struct {
	resultRepository ports.ResultRepository
	runnerRepository ports.RunnerRepository
}

func NewResultService(resultRepository ports.ResultRepository, runnerRepository ports.RunnerRepository) *resultService {
	return &resultService{
		resultRepository: resultRepository,
		runnerRepository: runnerRepository,
	}
}

func (s *resultService) Upload(eventID int64, file []byte) error {
	// TODO: Implement
	return nil
}

func (s *resultService) GetByEventID(eventID int64) ([]*domain.Result, error) {
	// TODO: Implement
	return nil, nil
}
