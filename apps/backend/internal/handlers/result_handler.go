package handlers

import (
	"backend/internal/core/ports"
	"github.com/gin-gonic/gin"
)

type ResultHandler struct {
	resultService ports.ResultService
}

func NewResultHandler(resultService ports.ResultService) *ResultHandler {
	return &ResultHandler{
		resultService: resultService,
	}
}

func (h *ResultHandler) Upload(c *gin.Context) {
	// TODO: Implement
}

func (h *ResultHandler) GetByEventID(c *gin.Context) {
	// TODO: Implement
}
