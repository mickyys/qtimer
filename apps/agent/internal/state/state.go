package state

import (
	"encoding/json"
	"os"
	"sync"
	"time"
)

// FileStatus defines the processing status of a file.
type FileStatus string

const (
	// StatusPending means the file is new or modified and waiting to be processed.
	StatusPending FileStatus = "Pending"
	// StatusProcessing means the file is currently being processed.
	StatusProcessing FileStatus = "Processing"
	// StatusFailed means the file processing failed after all retries.
	StatusFailed FileStatus = "Failed"
	// StatusCompleted means the file was successfully processed and moved.
	StatusCompleted FileStatus = "Completed"
)

// FileState represents the state of a single file.
type FileState struct {
	Hash       string     `json:"hash"`
	LastUpdate time.Time  `json:"last_update"`
	Status     FileStatus `json:"status"`
	RetryCount int        `json:"retry_count"`
	Error      string     `json:"error,omitempty"`
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

// GetFilesByStatus returns a map of file paths that match the given status.
func (s *State) GetFilesByStatus(status FileStatus) map[string]FileState {
	s.mu.Lock()
	defer s.mu.Unlock()

	files := make(map[string]FileState)
	for path, fileState := range s.Files {
		if fileState.Status == status {
			files[path] = fileState
		}
	}
	return files
}

// UpdateFileStatus updates the status of a file, along with an optional error message.
func (s *State) UpdateFileStatus(filepath string, status FileStatus, err error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if fileState, ok := s.Files[filepath]; ok {
		fileState.Status = status
		fileState.LastUpdate = time.Now().UTC()
		if err != nil {
			fileState.Error = err.Error()
		} else {
			fileState.Error = "" // Clear error on success
		}
		s.Files[filepath] = fileState
	}
}

// IncrementRetryCount increments the retry counter for a file.
func (s *State) IncrementRetryCount(filepath string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if fileState, ok := s.Files[filepath]; ok {
		fileState.RetryCount++
		s.Files[filepath] = fileState
	}
}
