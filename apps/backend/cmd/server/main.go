package main

import (
	"backend/internal/core/services"
	"backend/internal/handlers"
	"backend/internal/repositories"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Error loading .env file")
	}

	db, err := repositories.NewPostgresConnection()
	if err != nil {
		log.Fatalf("Could not connect to the database: %v", err)
	}

	userRepository := repositories.NewUserRepository(db)
	eventRepository := repositories.NewEventRepository(db)
	runnerRepository := repositories.NewRunnerRepository(db)
	resultRepository := repositories.NewResultRepository(db)

	userService := services.NewUserService(userRepository)
	eventService := services.NewEventService(eventRepository)
	resultService := services.NewResultService(resultRepository, runnerRepository)

	userHandler := handlers.NewUserHandler(userService)
	eventHandler := handlers.NewEventHandler(eventService)
	resultHandler := handlers.NewResultHandler(resultService)

	r := gin.Default()

	api := r.Group("/api")
	{
		users := api.Group("/users")
		{
			users.POST("/register", userHandler.Register)
			users.POST("/login", userHandler.Login)
		}
		events := api.Group("/events")
		{
			events.POST("", eventHandler.Create)
			events.GET("", eventHandler.GetAll)
			events.GET("/:id", eventHandler.GetByID)
		}
		results := api.Group("/results")
		{
			results.POST("/upload/:eventID", resultHandler.Upload)
			results.GET("/:eventID", resultHandler.GetByEventID)
		}
	}

	r.Run()
}
