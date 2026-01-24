package handlers

import (
	"backend/internal/core/domain"
	"backend/internal/core/ports"
	"backend/internal/core/services"
	"backend/internal/utils"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type EventHandler struct {
	eventService      ports.EventService
	cloudinaryService *services.CloudinaryService
}

func NewEventHandler(eventService ports.EventService, cloudinaryService *services.CloudinaryService) *EventHandler {
	return &EventHandler{
		eventService:      eventService,
		cloudinaryService: cloudinaryService,
	}
}

func (h *EventHandler) CreateEvent(c *gin.Context) {
	var req ports.CreateEventRequest

	// Parse JSON body
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	// Call service
	event, err := h.eventService.CreateEvent(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Return success response
	c.JSON(http.StatusOK, event)
}

func (h *EventHandler) Upload(c *gin.Context) {
	// 1. Parse multipart form
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil { // 10 MB
		c.JSON(http.StatusBadRequest, gin.H{"error": "could not parse multipart form"})
		return
	}

	// 2. Get file from form
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}

	// 3. Get hash from form
	clientHash := c.PostForm("hash")
	if clientHash == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "hash is required"})
		return
	}

	// 4. Call service
	result, err := h.eventService.Upload(fileHeader, clientHash)
	if err != nil {
		if errors.Is(err, services.ErrFileHashMismatch) || errors.Is(err, services.ErrInvalidFileExtension) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	// 5. Return success response
	c.JSON(http.StatusOK, result)
}

func (h *EventHandler) GetEvents(c *gin.Context) {
	// 1. Get query params
	name := c.Query("name")
	dateStr := c.Query("date")
	pageStr := c.Query("page")
	limitStr := c.Query("limit")
	includeHiddenStr := c.Query("includeHidden")

	var date *time.Time
	if dateStr != "" {
		parsedDate, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, use YYYY-MM-DD"})
			return
		}
		date = &parsedDate
	}

	var page, limit int
	var err error

	if pageStr != "" {
		page, err = strconv.Atoi(pageStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid page format, must be a number"})
			return
		}
	}

	if limitStr != "" {
		limit, err = strconv.Atoi(limitStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid limit format, must be a number"})
			return
		}
	}

	var namePtr *string
	if name != "" {
		namePtr = &name
	}

	// Parse includeHidden parameter
	includeHidden := includeHiddenStr == "true"

	// 2. Call service
	result, err := h.eventService.GetEventsWithFilter(namePtr, date, page, limit, includeHidden)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 3. Return response
	c.JSON(http.StatusOK, result)
}

func (h *EventHandler) UploadImageToCloudinary(c *gin.Context) {
	// Parse multipart form (max 50 MB for images)
	if err := c.Request.ParseMultipartForm(50 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "could not parse multipart form"})
		return
	}

	// Get file from form
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}

	// Validate file size (max 10 MB)
	if fileHeader.Size > 10<<20 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file size exceeds 10 MB limit"})
		return
	}

	// Validate file type
	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/webp": true,
		"image/gif":  true,
	}

	contentType := fileHeader.Header.Get("Content-Type")
	if !allowedTypes[contentType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid file type. allowed: jpg, png, webp, gif"})
		return
	}

	// Upload to Cloudinary
	result, err := h.cloudinaryService.UploadImage(c.Request.Context(), fileHeader, "qtimer-events")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"url":      result.SecureURL,
		"publicId": result.PublicID,
		"width":    result.Width,
		"height":   result.Height,
		"size":     result.Bytes,
		"format":   result.Format,
	})
}

func (h *EventHandler) UpdateEventImage(c *gin.Context) {
	// 1. Get event ID from path parameter
	eventID := c.Param("id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "event id is required"})
		return
	}

	// 2. Parse request body
	var req struct {
		ImageURL string `json:"imageUrl"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	if req.ImageURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "imageUrl is required"})
		return
	}

	// 3. Call service to update only the image
	event, err := h.eventService.UpdateEventImage(eventID, req.ImageURL)
	if err != nil {
		if err.Error() == "event not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "event not found"})
		} else if err.Error() == "invalid event id" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event id"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	// 4. Return updated event
	c.JSON(http.StatusOK, event)
}

func (h *EventHandler) GetParticipants(c *gin.Context) {
	// 1. Get path and query params
	eventParam := c.Param("id") // This could be either ID or slug
	name := c.Query("name")
	chip := c.Query("chip")
	dorsal := c.Query("dorsal")
	category := c.Query("category")
	distance := c.Query("distance")
	sex := c.Query("sex")
	position := c.Query("position")
	pageStr := c.Query("page")
	limitStr := c.Query("limit")

	// Resolve event to get the ID
	var eventID string
	if primitive.IsValidObjectID(eventParam) {
		eventID = eventParam
	} else if utils.IsValidSlug(eventParam) {
		// If it's a slug, get the event to extract the ID
		event, err := h.eventService.GetEventBySlug(eventParam)
		if err != nil {
			if err.Error() == "event not found" {
				c.JSON(http.StatusNotFound, gin.H{"error": "event not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			}
			return
		}
		eventID = event.ID.Hex()
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event identifier"})
		return
	}

	var page, limit int
	var err error

	if pageStr != "" {
		page, err = strconv.Atoi(pageStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid page format, must be a number"})
			return
		}
	}

	if limitStr != "" {
		limit, err = strconv.Atoi(limitStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid limit format, must be a number"})
			return
		}
	}

	// Helper to convert to pointer
	toPtr := func(s string) *string {
		if s == "" {
			return nil
		}
		return &s
	}

	// 2. Call service
	result, err := h.eventService.GetParticipants(eventID, toPtr(name), toPtr(chip), toPtr(dorsal), toPtr(category), toPtr(distance), toPtr(sex), toPtr(position), page, limit)
	if err != nil {
		if errors.Is(err, services.ErrInvalidObjectID) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	// 3. Return response
	c.JSON(http.StatusOK, result)
}

func (h *EventHandler) GetEvent(c *gin.Context) {
	eventParam := c.Param("id") // This could be either ID or slug

	var event *domain.Event
	var err error

	// First try to get by ID if the param looks like a valid ObjectID
	if primitive.IsValidObjectID(eventParam) {
		event, err = h.eventService.GetEvent(eventParam)
	} else if utils.IsValidSlug(eventParam) {
		// If it's not a valid ObjectID, try to get by slug
		event, err = h.eventService.GetEventBySlug(eventParam)
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event identifier"})
		return
	}

	if err != nil {
		if errors.Is(err, services.ErrInvalidObjectID) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event id"})
		} else if err.Error() == "event not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "event not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, event)
}

func (h *EventHandler) GetEventBySlug(c *gin.Context) {
	slug := c.Param("slug")
	fmt.Printf("[INFO] GetEventBySlug called with slug: %s\n", slug)

	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "slug is required"})
		return
	}

	event, err := h.eventService.GetEventBySlug(slug)
	if err != nil {
		if err.Error() == "event not found" {
			fmt.Printf("[WARNING] Event not found for slug: %s\n", slug)
			c.JSON(http.StatusNotFound, gin.H{"error": "event not found"})
		} else {
			fmt.Printf("[ERROR] Error fetching event by slug %s: %v\n", slug, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	fmt.Printf("[SUCCESS] Event found for slug: %s, Event ID: %s\n", slug, event.ID.Hex())
	c.JSON(http.StatusOK, event)
}

func (h *EventHandler) UpdateEvent(c *gin.Context) {
	eventID := c.Param("id")
	var req ports.UpdateEventRequest

	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	event, err := h.eventService.UpdateEvent(eventID, &req)
	if err != nil {
		if errors.Is(err, services.ErrInvalidObjectID) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event id"})
		} else if err.Error() == "event not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "event not found"})
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, event)
}

func (h *EventHandler) DeleteEvent(c *gin.Context) {
	eventID := c.Param("id")

	err := h.eventService.DeleteEvent(eventID)
	if err != nil {
		if errors.Is(err, services.ErrInvalidObjectID) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event id"})
		} else if err.Error() == "event not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "event not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "event deleted successfully"})
}

func (h *EventHandler) UpdateEventStatus(c *gin.Context) {
	eventID := c.Param("id")

	var req struct {
		Status string `json:"status"`
	}

	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	event, err := h.eventService.UpdateEventStatus(eventID, req.Status)
	if err != nil {
		if errors.Is(err, services.ErrInvalidObjectID) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event id"})
		} else if err.Error() == "event not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "event not found"})
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, event)
}

func (h *EventHandler) UploadToEvent(c *gin.Context) {
	// 1. Parse multipart form
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil { // 10 MB
		fmt.Printf("[ERROR] Failed to parse multipart form: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "could not parse multipart form"})
		return
	}

	// 2. Get event ID from URL params
	eventID := c.Param("id")
	fmt.Printf("[INFO] UploadToEvent called with eventID: %s\n", eventID)
	if eventID == "" {
		fmt.Printf("[ERROR] event id is empty\n")
		c.JSON(http.StatusBadRequest, gin.H{"error": "event id is required"})
		return
	}

	// 3. Get file from form
	fileHeader, err := c.FormFile("file")
	if err != nil {
		fmt.Printf("[ERROR] Failed to get file from form: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}
	fmt.Printf("[INFO] File received: %s (size: %d bytes)\n", fileHeader.Filename, fileHeader.Size)

	// 4. Get hash from form
	clientHash := c.PostForm("hash")
	if clientHash == "" {
		fmt.Printf("[ERROR] hash is empty\n")
		c.JSON(http.StatusBadRequest, gin.H{"error": "hash is required"})
		return
	}
	fmt.Printf("[INFO] Client hash: %s\n", clientHash)

	// 5. Call service
	fmt.Printf("[INFO] Calling eventService.UploadToEvent with eventID=%s, hash=%s\n", eventID, clientHash)
	result, err := h.eventService.UploadToEvent(fileHeader, clientHash, eventID)
	if err != nil {
		fmt.Printf("[ERROR] UploadToEvent service failed: %v\n", err)
		if errors.Is(err, services.ErrFileHashMismatch) || errors.Is(err, services.ErrInvalidFileExtension) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		} else if errors.Is(err, services.ErrInvalidObjectID) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event id"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	// 6. Return success response
	fmt.Printf("[SUCCESS] Upload completed. EventID=%s, RecordsInserted=%d, Reprocessed=%v\n", result.EventID, result.RecordsInserted, result.Reprocessed)
	c.JSON(http.StatusOK, result)
}

// GetParticipantComparison obtiene el 1er lugar y los 5 participantes anteriores
func (h *EventHandler) GetParticipantComparison(c *gin.Context) {
	eventParam := c.Param("id")
	bib := c.Query("bib")
	distance := c.Query("distance")
	category := c.Query("category")

	if bib == "" || distance == "" || category == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bib, distance and category parameters are required"})
		return
	}

	// Resolve event to get the ID
	var eventID string
	if primitive.IsValidObjectID(eventParam) {
		eventID = eventParam
	} else if utils.IsValidSlug(eventParam) {
		event, err := h.eventService.GetEventBySlug(eventParam)
		if err != nil {
			if err.Error() == "event not found" {
				c.JSON(http.StatusNotFound, gin.H{"error": "event not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			}
			return
		}
		eventID = event.ID.Hex()
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event identifier"})
		return
	}

	result, err := h.eventService.GetParticipantComparison(eventID, bib, distance, category)
	if err != nil {
		if errors.Is(err, services.ErrInvalidObjectID) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, result)
}
