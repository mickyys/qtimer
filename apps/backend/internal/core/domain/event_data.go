package domain

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type EventData struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	EventID   primitive.ObjectID `bson:"eventId" json:"eventId"`
	Data      map[string]string  `bson:"data" json:"data"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
}
