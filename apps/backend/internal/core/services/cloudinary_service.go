package services

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"os"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

type CloudinaryService struct {
	client *cloudinary.Cloudinary
}

// CloudinaryUploadResponse represents the response from Cloudinary upload
type CloudinaryUploadResponse struct {
	PublicID     string `json:"public_id"`
	URL          string `json:"url"`
	SecureURL    string `json:"secure_url"`
	Width        int    `json:"width"`
	Height       int    `json:"height"`
	Format       string `json:"format"`
	ResourceType string `json:"resource_type"`
	CreatedAt    string `json:"created_at"`
	Bytes        int    `json:"bytes"`
	Type         string `json:"type"`
}

// NewCloudinaryService creates a new Cloudinary service instance
func NewCloudinaryService() (*CloudinaryService, error) {
	cloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
	apiKey := os.Getenv("CLOUDINARY_API_KEY")
	apiSecret := os.Getenv("CLOUDINARY_API_SECRET")

	if cloudName == "" || apiKey == "" || apiSecret == "" {
		return nil, fmt.Errorf("cloudinary credentials not configured")
	}

	// Create a secure URL for authentication
	secureURL := fmt.Sprintf("cloudinary://%s:%s@%s", apiKey, apiSecret, cloudName)

	cld, err := cloudinary.NewFromURL(secureURL)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize cloudinary: %w", err)
	}

	return &CloudinaryService{
		client: cld,
	}, nil
}

// UploadImage uploads an image to Cloudinary
func (cs *CloudinaryService) UploadImage(ctx context.Context, fileHeader *multipart.FileHeader, folder string) (*CloudinaryUploadResponse, error) {
	// Open the uploaded file
	file, err := fileHeader.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	// Read the file into a buffer
	fileBuffer := new(bytes.Buffer)
	_, err = io.Copy(fileBuffer, file)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	// Determine the resource type based on MIME type
	resourceType := "image"
	if fileHeader.Header.Get("Content-Type") == "application/pdf" {
		resourceType = "raw"
	}

	// Upload to Cloudinary
	uploadParams := uploader.UploadParams{
		Folder:       folder,
		ResourceType: resourceType,
	}

	result, err := cs.client.Upload.Upload(ctx, fileBuffer, uploadParams)
	if err != nil {
		return nil, fmt.Errorf("cloudinary upload failed: %w", err)
	}

	// Build response
	response := &CloudinaryUploadResponse{
		PublicID:     result.PublicID,
		URL:          result.URL,
		SecureURL:    result.SecureURL,
		Width:        result.Width,
		Height:       result.Height,
		Format:       result.Format,
		ResourceType: result.ResourceType,
		CreatedAt:    result.CreatedAt.String(),
		Bytes:        result.Bytes,
		Type:         result.Type,
	}

	return response, nil
}

// UploadImageFromURL uploads an image directly from a URL
func (cs *CloudinaryService) UploadImageFromURL(ctx context.Context, imageURL string, folder string) (*CloudinaryUploadResponse, error) {
	uploadParams := uploader.UploadParams{
		Folder: folder,
	}

	result, err := cs.client.Upload.Upload(ctx, imageURL, uploadParams)
	if err != nil {
		return nil, fmt.Errorf("cloudinary upload failed: %w", err)
	}

	response := &CloudinaryUploadResponse{
		PublicID:     result.PublicID,
		URL:          result.URL,
		SecureURL:    result.SecureURL,
		Width:        result.Width,
		Height:       result.Height,
		Format:       result.Format,
		ResourceType: result.ResourceType,
		CreatedAt:    result.CreatedAt.String(),
		Bytes:        result.Bytes,
		Type:         result.Type,
	}

	return response, nil
}

// DeleteImage deletes an image from Cloudinary
func (cs *CloudinaryService) DeleteImage(ctx context.Context, publicID string) error {
	_, err := cs.client.Upload.Destroy(ctx, uploader.DestroyParams{
		PublicID: publicID,
	})
	if err != nil {
		return fmt.Errorf("failed to delete image: %w", err)
	}
	return nil
}
