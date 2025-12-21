package config

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// Config holds the application configuration.
type Config struct {
	DirectoryToWatch    string `json:"directory_to_watch"`
	Endpoint            string `json:"endpoint"`
	CheckIntervalSeconds int    `json:"check_interval_seconds"`
	HTTPTimeoutSeconds   int    `json:"http_timeout_seconds"`
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
