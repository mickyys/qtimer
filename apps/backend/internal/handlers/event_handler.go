package handlers

import (
	"backend/internal/core/ports"
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

func (h *EventHandler) Create(c *gin.Context) {
	// TODO: Implement
}

func (h *EventHandler) GetAll(c *gin.Context) {
	// TODO: Implement
}

func (h *EventHandler) GetByID(c *gin.Context) {
	// TODO: Implement
}
