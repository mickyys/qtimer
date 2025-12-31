package domain

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Race representa una carrera dentro de un evento (ej: "CAD 3G", "NOV 3G", etc.)
type Race struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	EventID   primitive.ObjectID `bson:"eventId" json:"eventId"`
	Name      string             `bson:"name" json:"name"`         // Ej: "CAD 3G"
	Order     int                `bson:"order" json:"order"`       // Orden de la carrera en el evento
	Category  string             `bson:"category" json:"category"` // Ej: "Cadetes"
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
}

// Category representa una categoría única (ej: "Cadetes", "Novicios", etc.)
type Category struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name      string             `bson:"name" json:"name"` // Ej: "Cadetes"
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
}
