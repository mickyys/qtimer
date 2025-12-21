package logger

import (
	"io"
	"log"
	"os"
	"path/filepath"
)

var (
	// Info logger for informational messages
	Info *log.Logger
	// Warning logger for warning messages
	Warning *log.Logger
	// Error logger for error messages
	Error *log.Logger

	logFile io.WriteCloser
)

// InitLogger initializes the loggers to write to the specified file.
func InitLogger(logFilePath string) {
	dir := filepath.Dir(logFilePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		log.Fatalf("Failed to create log directory: %v", err)
	}

	var err error
	logFile, err = os.OpenFile(logFilePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0666)
	if err != nil {
		log.Fatalf("Failed to open log file: %v", err)
	}

	Info = log.New(logFile, "INFO: ", log.Ldate|log.Ltime|log.LUTC)
	Warning = log.New(logFile, "WARNING: ", log.Ldate|log.Ltime|log.LUTC)
	Error = log.New(logFile, "ERROR: ", log.Ldate|log.Ltime|log.LUTC)
}

// Close closes the log file.
func Close() {
	if logFile != nil {
		logFile.Close()
	}
}
