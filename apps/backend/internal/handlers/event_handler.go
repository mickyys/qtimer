package handlers

import (
	"backend/internal/core/ports"
	"backend/internal/core/services"
	"errors"
	"net/http"

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
