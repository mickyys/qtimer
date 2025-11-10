package handlers

import (
	"backend/internal/core/ports"
	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	userService ports.UserService
}

func NewUserHandler(userService ports.UserService) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

func (h *UserHandler) Register(c *gin.Context) {
	// TODO: Implement
}

func (h *UserHandler) Login(c *gin.Context) {
	// TODO: Implement
}
