package main

import (
	"backend/internal/core/services"
	"backend/internal/handlers"
	"backend/internal/repositories"
	"backend/pkg/database"
	"log"
	"os"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Error loading .env file")
	}

	mongoClient, err := database.NewMongoConnection()
	if err != nil {
		log.Fatalf("Could not connect to the mongo database: %v", err)
	}

	eventRepository := repositories.NewMongoEventRepository(mongoClient)

	eventService := services.NewEventService(eventRepository)

	cloudinaryService, err := services.NewCloudinaryService()
	if err != nil {
		log.Println("Warning: Cloudinary not configured. Image uploads will be disabled.")
	}

	eventHandler := handlers.NewEventHandler(eventService, cloudinaryService)

	r := gin.Default()

	// Configure CORS
	allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
	origins := []string{"http://localhost:3000"} // Default
	if allowedOrigins != "" {
		origins = strings.Split(allowedOrigins, ",")
		// Trim spaces just in case
		for i, origin := range origins {
			origins[i] = strings.TrimSpace(origin)
		}
	}

	r.Use(cors.New(cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	api := r.Group("/api")
	{
		events := api.Group("/events")
		{
			events.POST("/create", eventHandler.CreateEvent)
			events.POST("/upload", eventHandler.Upload)
			events.POST("/:id/upload", eventHandler.UploadToEvent)
			events.POST("/upload-image", eventHandler.UploadImageToCloudinary)
			events.GET("", eventHandler.GetEvents)
			events.GET("/slug/:slug", eventHandler.GetEventBySlug)
			events.GET("/:id", eventHandler.GetEvent)
			events.PUT("/:id", eventHandler.UpdateEvent)
			events.PATCH("/:id/image", eventHandler.UpdateEventImage)
			events.DELETE("/:id", eventHandler.DeleteEvent)
			events.PATCH("/:id/status", eventHandler.UpdateEventStatus)
			events.GET("/:id/participants", eventHandler.GetParticipants)
			events.GET("/:id/participants/comparison", eventHandler.GetParticipantComparison)
		}
	}

	r.Run()
}
