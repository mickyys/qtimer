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

// SendFile sends a file to the specified endpoint with its hash.
func SendFile(ctx context.Context, filePath, endpoint, fileHash string, timeout time.Duration) error {
	file, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Add file
	part, err := writer.CreateFormFile("file", filepath.Base(filePath))
	if err != nil {
		return err
	}
	_, err = io.Copy(part, file)
	if err != nil {
		return err
	}

	// Add hash field
	if err := writer.WriteField("hash", fileHash); err != nil {
		return err
	}

	writer.Close()

	req, err := http.NewRequestWithContext(ctx, "POST", endpoint, body)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{
		Timeout: timeout,
	}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to send file %s, received status code: %d", filePath, resp.StatusCode)
	}

	return nil
}
