package main

import (
	"backend/internal/core/services"
	"backend/internal/handlers"
	"backend/internal/repositories"
	"backend/pkg/database"
	"log"
	"os"

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

	eventHandler := handlers.NewEventHandler(eventService)

	r := gin.Default()

	// Configure CORS only for local environment
	if os.Getenv("ENVIRONMENT") == "local" || os.Getenv("ENVIRONMENT") == "" {
		r.Use(cors.New(cors.Config{
			AllowOrigins:     []string{"http://localhost:3000"},
			AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
			AllowHeaders:     []string{"Content-Type", "Authorization"},
			ExposeHeaders:    []string{"Content-Length"},
			AllowCredentials: true,
		}))
	}

	api := r.Group("/api")
	{
		events := api.Group("/events")
		{
			events.POST("/upload", eventHandler.Upload)
			events.GET("", eventHandler.GetEvents)
			events.GET("/:id/participants", eventHandler.GetParticipants)
		}
	}

	r.Run()
}
