package handlers

import (
	"backend/internal/core/ports"
	"backend/internal/core/services"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type EventHandler struct {
	eventService ports.EventService
}

func NewEventHandler(eventService ports.EventService) *EventHandler {
	return &EventHandler{
		eventService: eventService,
	}
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

	// 2. Call service
	result, err := h.eventService.GetEvents(namePtr, date, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 3. Return response
	c.JSON(http.StatusOK, result)
}

func (h *EventHandler) GetParticipants(c *gin.Context) {
	// 1. Get path and query params
	eventID := c.Param("id")
	name := c.Query("name")
	chip := c.Query("chip")
	dorsal := c.Query("dorsal")
	category := c.Query("category")
	sex := c.Query("sex")
	position := c.Query("position")
	pageStr := c.Query("page")
	limitStr := c.Query("limit")

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
	result, err := h.eventService.GetParticipants(eventID, toPtr(name), toPtr(chip), toPtr(dorsal), toPtr(category), toPtr(sex), toPtr(position), page, limit)
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
