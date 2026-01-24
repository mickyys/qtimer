package main

import (
	"agent/internal/config"
	"agent/internal/logger"
	"agent/internal/processor"
	"agent/internal/sender"
	"agent/internal/state"
	"agent/internal/utils"
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/kardianos/service"
)

type program struct {
	exit            chan struct{}
	cfg             *config.Config
	appState        *state.State
	configPath      string
	logPath         string
	statePath       string
	processingFiles map[string]bool
	processingMutex sync.Mutex
	wg              sync.WaitGroup
}

func (p *program) Start(s service.Service) error {
	p.exit = make(chan struct{})
	p.processingFiles = make(map[string]bool)
	go p.run()
	return nil
}

func (p *program) run() {
	// Initialize logger
	logger.InitLogger(p.logPath)
	logger.Info.Println("Agent service starting...")

	// Load configuration
	var err error
	p.cfg, err = config.LoadConfig(p.configPath)
	if err != nil {
		logger.Error.Fatalf("Failed to load configuration: %v", err)
	}

	// Load state
	p.appState, err = state.LoadState(p.statePath)
	if err != nil {
		logger.Error.Fatalf("Failed to load state: %v", err)
	}

	// Re-queue any files that were in 'Processing' state during the last shutdown
	requeuedCount := p.appState.RequeueProcessingFiles()
	if requeuedCount > 0 {
		logger.Info.Printf("Re-queued %d files that were in a 'Processing' state.", requeuedCount)
		if err := p.appState.SaveState(p.statePath); err != nil {
			logger.Error.Printf("Failed to save state after re-queuing files: %v", err)
		}
	}

	ticker := time.NewTicker(time.Duration(p.cfg.CheckIntervalSeconds) * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			p.scanAndProcessFiles()
		case <-p.exit:
			ticker.Stop()
			// Wait for any running jobs to finish
			p.wg.Wait()
			return
		}
	}
}

func (p *program) Stop(s service.Service) error {
	logger.Info.Println("Agent service stopping...")
	if p.appState != nil {
		if err := p.appState.SaveState(p.statePath); err != nil {
			logger.Error.Printf("Failed to save state on shutdown: %v", err)
		}
	}
	close(p.exit)
	logger.Close()
	return nil
}

func main() {
	ex, err := os.Executable()
	if err != nil {
		log.Fatalf("Failed to get executable path: %v", err)
	}
	exPath := filepath.Dir(ex)

	prg := &program{
		configPath: filepath.Join(exPath, "config", "config.json"),
		logPath:    filepath.Join(exPath, "logs", "app.log"),
		statePath:  filepath.Join(exPath, "state.json"),
	}

	svcConfig := &service.Config{
		Name:        "GoAgent",
		DisplayName: "Go File Agent",
		Description: "Monitors a directory and sends modified files.",
	}

	s, err := service.New(prg, svcConfig)
	if err != nil {
		log.Fatal(err)
	}

	if len(os.Args) > 1 {
		err = service.Control(s, os.Args[1])
		if err != nil {
			log.Fatal(err)
		}
		return
	}

	err = s.Run()
	if err != nil {
		log.Fatal(err)
	}
}

func (p *program) scanAndProcessFiles() {
	logger.Info.Println("Scanning for new or modified files...")

	// First, update file states based on directory scan
	err := processor.UpdateFileStates(p.cfg.DirectoryToWatch, p.appState)
	if err != nil {
		logger.Error.Printf("Error scanning directory: %v", err)
		return
	}

	filesToProcess := p.appState.GetFilesByStatus(state.StatusPending)
	if len(filesToProcess) == 0 {
		logger.Info.Println("No pending files to process.")
		return
	}

	logger.Info.Printf("Found %d pending files. Processing...", len(filesToProcess))

	// Process each file asynchronously
	for filePath := range filesToProcess {
		p.processingMutex.Lock()
		// Avoid processing the same file multiple times concurrently
		if p.processingFiles[filePath] {
			p.processingMutex.Unlock()
			continue
		}
		p.processingFiles[filePath] = true
		p.processingMutex.Unlock()

		p.wg.Add(1)
		go p.processFileWrapper(filePath)
	}

	// Wait for all spawned goroutines to complete
	p.wg.Wait()
	logger.Info.Println("Processing cycle finished.")

	// Save the state after a full processing cycle
	if err := p.appState.SaveState(p.statePath); err != nil {
		logger.Error.Printf("Failed to save state after processing cycle: %v", err)
	}
}

func (p *program) processFileWrapper(filePath string) {
	defer func() {
		p.wg.Done()
		p.processingMutex.Lock()
		delete(p.processingFiles, filePath)
		p.processingMutex.Unlock()
	}()

	// Update status to Processing
	p.appState.UpdateFileStatus(filePath, state.StatusProcessing, nil)
	logger.Info.Printf("Processing %s", filePath)

	var err error
	for i := 0; i < p.cfg.MaxRetries; i++ {
		err = p.processFile(filePath)
		if err == nil {
			break // Success
		}
		logger.Error.Printf("Attempt %d/%d failed for %s: %v", i+1, p.cfg.MaxRetries, filePath, err)
		p.appState.IncrementRetryCount(filePath)

		// Wait before retrying
		time.Sleep(time.Duration(p.cfg.RetryDelaySeconds) * time.Second)
	}

	if err != nil {
		logger.Error.Printf("All retries failed for %s. Moving to error directory.", filePath)
		p.appState.UpdateFileStatus(filePath, state.StatusFailed, err)
		errDir := p.cfg.ErrorDirectory
		if moveErr := utils.MoveFile(filePath, errDir, true); moveErr != nil {
			logger.Error.Printf("Failed to move file %s to error directory: %v", filePath, moveErr)
		}
		return
	}

	logger.Info.Printf("Successfully processed %s. Moving to completed directory.", filePath)
	p.appState.UpdateFileStatus(filePath, state.StatusCompleted, nil)
	completedDir := p.cfg.CompletedDirectory
	if moveErr := utils.MoveFile(filePath, completedDir, true); moveErr != nil {
		logger.Error.Printf("Failed to move file %s to completed directory: %v", filePath, moveErr)
	}
}

// processFile contains the core logic for processing a single file.
func (p *program) processFile(filePath string) error {
	logger.Info.Printf("Starting upload for file: %s", filePath)

	// Get the file's hash from the state
	fileState, ok := p.appState.GetFileState(filePath)
	if !ok {
		return fmt.Errorf("could not find state for file %s", filePath)
	}
	hash := fileState.Hash

	// Create a context with a timeout for the operation
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(p.cfg.HTTPTimeoutSeconds)*time.Second)
	defer cancel()

	// Upload the file and its hash
	err := sender.SendFile(ctx, filePath, p.cfg.UploadEndpoint, hash, time.Duration(p.cfg.HTTPTimeoutSeconds)*time.Second)
	if err != nil {
		return fmt.Errorf("upload failed: %w", err)
	}

	logger.Info.Printf("Successfully uploaded file: %s", filePath)
	return nil
}
