package repositories

import (
	"context"
	"os"
	"time"

	"backend/internal/core/domain"
	"backend/internal/core/ports"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type mongoEventRepository struct {
	db       *mongo.Client
	dbName   string
}

func NewMongoEventRepository(db *mongo.Client) ports.EventRepository {
	return &mongoEventRepository{
		db:       db,
		dbName:   os.Getenv("MONGO_DATABASE"),
	}
}

func (r *mongoEventRepository) getEventCollection() *mongo.Collection {
	return r.db.Database(r.dbName).Collection("events")
}

func (r *mongoEventRepository) getEventDataCollection() *mongo.Collection {
	return r.db.Database(r.dbName).Collection("event_data")
}

func (r *mongoEventRepository) Save(event *domain.Event) error {
	event.CreatedAt = time.Now()
	_, err := r.getEventCollection().InsertOne(context.Background(), event)
	return err
}

func (r *mongoEventRepository) FindByCode(code string) (*domain.Event, error) {
	var event domain.Event
	err := r.getEventCollection().FindOne(context.Background(), bson.M{"code": code}).Decode(&event)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}
	return &event, nil
}

func (r *mongoEventRepository) UpdateFileHash(id primitive.ObjectID, hash string) error {
	_, err := r.getEventCollection().UpdateOne(
		context.Background(),
		bson.M{"_id": id},
		bson.M{"$set": bson.M{"fileHash": hash}},
	)
	return err
}

func (r *mongoEventRepository) DeleteEventData(eventID primitive.ObjectID) error {
	_, err := r.getEventDataCollection().DeleteMany(context.Background(), bson.M{"eventId": eventID})
	return err
}

func (r *mongoEventRepository) SaveAllData(data []domain.EventData) (int, error) {
	docs := make([]interface{}, len(data))
	for i, d := range data {
		d.CreatedAt = time.Now()
		docs[i] = d
	}

	result, err := r.getEventDataCollection().InsertMany(context.Background(), docs)
	if err != nil {
		return 0, err
	}
	return len(result.InsertedIDs), nil
}
