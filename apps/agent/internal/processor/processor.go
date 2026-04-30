package processor

import (
	"agent/internal/logger"
	"agent/internal/state"
	"agent/internal/utils"
	"os"
	"path/filepath"
	"time"
)

// UpdateFileStates scans a directory, compares files against the current state,
// and updates their status to Pending if they are new or modified.
func UpdateFileStates(directory string, appState *state.State) error {
	files, err := os.ReadDir(directory)
	if err != nil {
		return err
	}

	for _, file := range files {
		if file.IsDir() {
			continue
		}

		filePath := filepath.Join(directory, file.Name())
		hash, err := utils.CalculateSHA256(filePath)
		if err != nil {
			logger.Error.Printf("Failed to calculate hash for %s: %v", filePath, err)
			continue
		}

		existingState, ok := appState.GetFileState(filePath)

		// If the file is new or the hash has changed, mark it as Pending.
		// We also check if the file was previously marked as Failed, in which case we can retry it.
		if !ok || existingState.Hash != hash {
			if !ok {
				logger.Info.Printf("New file detected: %s", filePath)
			} else {
				logger.Info.Printf("File modified: %s", filePath)
			}

			newState := state.FileState{
				Hash:       hash,
				LastUpdate: time.Now().UTC(),
				Status:     state.StatusPending,
				RetryCount: 0,
				Error:      "",
			}
			appState.SetFileState(filePath, newState)
		}
	}

	return nil
}
