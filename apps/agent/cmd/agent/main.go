package main

import (
	"agent/internal/config"
	"agent/internal/logger"
	"agent/internal/processor"
	"agent/internal/sender"
	"agent/internal/state"
	"context"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/kardianos/service"
)

type program struct {
	exit       chan struct{}
	cfg        *config.Config
	appState   *state.State
	configPath string
	logPath    string
	statePath  string
}

func (p *program) Start(s service.Service) error {
	p.exit = make(chan struct{})
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

	ticker := time.NewTicker(time.Duration(p.cfg.CheckIntervalSeconds) * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			runCheck(p.cfg, p.appState, p.statePath)
		case <-p.exit:
			ticker.Stop()
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
	logger.Close() // Close the log file
	return nil
}

func main() {
	// Determine paths relative to the executable
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

func runCheck(cfg *config.Config, appState *state.State, statePath string) {
	logger.Info.Println("Running directory check...")

	// Get a copy of the current file states to avoid holding a lock during processing
	fileStates := appState.GetFileStatesCopy()

	modifiedFiles, err := processor.ProcessDirectory(cfg.DirectoryToWatch, fileStates)
	if err != nil {
		logger.Error.Printf("Error processing directory: %v", err)
		return
	}

	if len(modifiedFiles) == 0 {
		logger.Info.Println("No modified files detected.")
		return
	}

	logger.Info.Printf("Found %d modified files. Sending...", len(modifiedFiles))
	successfulSends := 0
	timeout := time.Duration(cfg.HTTPTimeoutSeconds) * time.Second
	for file, hash := range modifiedFiles {
		// Create a new context for each file sending task.
		// In a more complex scenario, this context could be tied to the application's lifecycle.
		ctx := context.Background()
		err := sender.SendFile(ctx, file, cfg.Endpoint, timeout)
		if err != nil {
			logger.Error.Printf("Failed to send file %s: %v", file, err)
		} else {
			// Update the state only after a successful send
			appState.SetFileState(file, state.FileState{
				Hash:     hash,
				LastSent: time.Now().UTC(),
			})
			successfulSends++
		}
	}

	// Save the state only if there were successful sends
	if successfulSends > 0 {
		if err := appState.SaveState(statePath); err != nil {
			logger.Error.Printf("Failed to save state: %v", err)
		}
	}
	logger.Info.Println("Check finished.")
}
