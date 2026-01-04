package sender

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

// UploadResponse es la estructura esperada de la respuesta del endpoint de carga inicial.
type UploadResponse struct {
	UploadID string `json:"upload_id"`
	Message  string `json:"message"`
}

// EventQueryResponse es la estructura esperada de la respuesta del endpoint de consulta de eventos.
type EventQueryResponse struct {
	EventID string `json:"event_id"`
}

// InitialUpload envía un archivo al endpoint de carga inicial.
func InitialUpload(ctx context.Context, filePath, endpoint string, timeout time.Duration) (*UploadResponse, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("file", filepath.Base(filePath))
	if err != nil {
		return nil, fmt.Errorf("failed to create form file: %w", err)
	}
	if _, err = io.Copy(part, file); err != nil {
		return nil, fmt.Errorf("failed to copy file to buffer: %w", err)
	}
	writer.Close()

	req, err := http.NewRequestWithContext(ctx, "POST", endpoint, body)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{Timeout: timeout}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("received non-OK status code: %d", resp.StatusCode)
	}

	var uploadResp UploadResponse
	if err := json.NewDecoder(resp.Body).Decode(&uploadResp); err != nil {
		return nil, fmt.Errorf("failed to decode upload response: %w", err)
	}

	return &uploadResp, nil
}

// QueryEvent consulta el endpoint de eventos para obtener el ID del evento asociado a un uploadID.
func QueryEvent(ctx context.Context, endpoint string, uploadID string, timeout time.Duration) (*EventQueryResponse, error) {
	payload, err := json.Marshal(map[string]string{"upload_id": uploadID})
	if err != nil {
		return nil, fmt.Errorf("failed to marshal query payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewBuffer(payload))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: timeout}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("received non-OK status code: %d", resp.StatusCode)
	}

	var eventResp EventQueryResponse
	if err := json.NewDecoder(resp.Body).Decode(&eventResp); err != nil {
		return nil, fmt.Errorf("failed to decode event response: %w", err)
	}

	return &eventResp, nil
}

// FinalUpload envía el archivo junto con el ID del evento al endpoint de carga final.
func FinalUpload(ctx context.Context, filePath, endpoint string, eventID string, timeout time.Duration) error {
	file, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Añadir el ID del evento como un campo del formulario
	if err := writer.WriteField("event_id", eventID); err != nil {
		return fmt.Errorf("failed to write event_id field: %w", err)
	}

	// Añadir el archivo
	part, err := writer.CreateFormFile("file", filepath.Base(filePath))
	if err != nil {
		return fmt.Errorf("failed to create form file: %w", err)
	}
	if _, err = io.Copy(part, file); err != nil {
		return fmt.Errorf("failed to copy file to buffer: %w", err)
	}
	writer.Close()

	req, err := http.NewRequestWithContext(ctx, "POST", endpoint, body)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{Timeout: timeout}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("http request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("received non-OK status code: %d", resp.StatusCode)
	}

	return nil
}
