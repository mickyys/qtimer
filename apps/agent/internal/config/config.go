package config

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// Config holds the application configuration.
type Config struct {
	DirectoryToWatch     string `json:"directory_to_watch"`
	CompletedDirectory   string `json:"completed_directory"`
	ErrorDirectory       string `json:"error_directory"`
	InitialUploadEndpoint string `json:"initial_upload_endpoint"`
	EventQueryEndpoint   string `json:"event_query_endpoint"`
	FinalUploadEndpoint  string `json:"final_upload_endpoint"`
	CheckIntervalSeconds int    `json:"check_interval_seconds"`
	HTTPTimeoutSeconds   int    `json:"http_timeout_seconds"`
	MaxRetries           int    `json:"max_retries"`
	RetryDelaySeconds    int    `json:"retry_delay_seconds"`
}

// LoadConfig reads the configuration from the given path.
func LoadConfig(path string) (*Config, error) {
	configFile, err := os.Open(filepath.Clean(path))
	if err != nil {
		return nil, err
	}
	defer configFile.Close()

	var cfg Config
	decoder := json.NewDecoder(configFile)
	if err := decoder.Decode(&cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}
