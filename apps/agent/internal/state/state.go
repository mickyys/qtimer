package state

import (
	"encoding/json"
	"os"
	"sync"
	"time"
)

// FileState represents the state of a single file.
type FileState struct {
	Hash    string    `json:"hash"`
	LastSent time.Time `json:"last_sent"`
}

// State represents the overall state of the agent.
type State struct {
	Files map[string]FileState `json:"files"`
	mu    sync.Mutex
}

// NewState creates a new State object.
func NewState() *State {
	return &State{
		Files: make(map[string]FileState),
	}
}

// LoadState loads the state from a JSON file.
func LoadState(path string) (*State, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return NewState(), nil
		}
		return nil, err
	}

	var s State
	if err := json.Unmarshal(data, &s); err != nil {
		return nil, err
	}
	// Make sure the map is initialized
	if s.Files == nil {
		s.Files = make(map[string]FileState)
	}

	return &s, nil
}

// SaveState saves the state to a JSON file.
func (s *State) SaveState(path string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	data, err := json.MarshalIndent(s, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(path, data, 0644)
}

// GetFileState returns the state of a file.
func (s *State) GetFileState(filepath string) (FileState, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	state, ok := s.Files[filepath]
	return state, ok
}

// GetFileStatesCopy returns a copy of the file states map.
func (s *State) GetFileStatesCopy() map[string]FileState {
	s.mu.Lock()
	defer s.mu.Unlock()

	copied := make(map[string]FileState)
	for key, value := range s.Files {
		copied[key] = value
	}
	return copied
}

// SetFileState sets the state of a file.
func (s *State) SetFileState(filepath string, state FileState) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.Files[filepath] = state
}
