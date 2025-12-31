package domain

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Event struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name          string             `bson:"name" json:"name"`
	Date          time.Time          `bson:"date" json:"date"`
	Time          string             `bson:"time" json:"time"`
	Address       string             `bson:"address" json:"address"`
	ImageURL      string             `bson:"imageUrl" json:"imageUrl"`
	FileName      string             `bson:"fileName" json:"fileName"`
	FileExtension string             `bson:"fileExtension" json:"fileExtension"`
	Status        string             `bson:"status" json:"status"`
	CreatedAt     time.Time          `bson:"createdAt" json:"createdAt"`
	FileHash      string             `bson:"fileHash" json:"fileHash"`
}
