# Use the official Golang image as the base image
FROM golang:1.24-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy go.mod and go.sum to download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the application source code
COPY . .

# Install air for hot-reloading
RUN go install github.com/cosmtrek/air@latest

# Expose the port the application runs on
EXPOSE 8080

# Command to run the application using air
CMD ["air", "-c", ".air.toml"]
