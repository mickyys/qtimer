package sender

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

// UploadFile envía un archivo y su hash a un endpoint.
func UploadFile(ctx context.Context, filePath, endpoint, hash string, timeout time.Duration) error {
	file, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Añadir el campo hash
	if err := writer.WriteField("hash", hash); err != nil {
		return fmt.Errorf("failed to write hash field: %w", err)
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
		// Leer el cuerpo de la respuesta para obtener más detalles del error, si es posible
		responseBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("received non-OK status code: %d. Response: %s", resp.StatusCode, string(responseBody))
	}

	return nil
}
