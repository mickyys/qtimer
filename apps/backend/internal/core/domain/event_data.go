package domain

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type EventData struct {
	ID        primitive.ObjectID     `bson:"_id,omitempty" json:"id"`
	EventID   primitive.ObjectID     `bson:"eventId" json:"eventId"`
	RaceID    primitive.ObjectID     `bson:"raceId,omitempty" json:"raceId"`
	Data      map[string]interface{} `bson:"data" json:"data"`
	CreatedAt time.Time              `bson:"createdAt" json:"createdAt"`
}
