package processor

import (
	"agent/internal/logger"
	"agent/internal/state"
	"agent/internal/utils"
	"os"
	"path/filepath"
)

// ProcessDirectory scans a directory and identifies modified files by comparing their hashes with the provided state.
// It returns a map of file paths to their new hashes for files that have been modified.
func ProcessDirectory(directory string, fileStates map[string]state.FileState) (map[string]string, error) {
	modifiedFiles := make(map[string]string)

	files, err := os.ReadDir(directory)
	if err != nil {
		return nil, err
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

		existingState, ok := fileStates[filePath]
		if !ok || existingState.Hash != hash {
			logger.Info.Printf("File modified: %s", filePath)
			modifiedFiles[filePath] = hash
		}
	}

	return modifiedFiles, nil
}
