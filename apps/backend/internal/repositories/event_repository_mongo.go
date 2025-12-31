package repositories

import (
	"context"
	"fmt"
	"os"
	"time"

	"backend/internal/core/domain"
	"backend/internal/core/ports"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type mongoEventRepository struct {
	db     *mongo.Client
	dbName string
}

func NewMongoEventRepository(db *mongo.Client) ports.EventRepository {
	return &mongoEventRepository{
		db:     db,
		dbName: os.Getenv("MONGO_DATABASE"),
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

func (r *mongoEventRepository) FindByName(name string) (*domain.Event, error) {
	var event domain.Event
	err := r.getEventCollection().FindOne(context.Background(), bson.M{"name": name}).Decode(&event)
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

func (r *mongoEventRepository) Find(name *string, date *time.Time, page int, limit int) (*ports.FindEventsResult, error) {
	filter := bson.M{}
	if name != nil {
		filter["name"] = bson.M{"$regex": name, "$options": "i"}
	}
	if date != nil {
		startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
		endOfDay := startOfDay.Add(24 * time.Hour)
		filter["date"] = bson.M{"$gte": startOfDay, "$lt": endOfDay}
	}

	totalCount, err := r.getEventCollection().CountDocuments(context.Background(), filter)
	if err != nil {
		return nil, err
	}

	findOptions := options.Find()
	findOptions.SetSkip(int64((page - 1) * limit))
	findOptions.SetLimit(int64(limit))
	findOptions.SetSort(bson.D{{Key: "date", Value: -1}})

	cursor, err := r.getEventCollection().Find(context.Background(), filter, findOptions)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	var events []*domain.Event
	if err = cursor.All(context.Background(), &events); err != nil {
		return nil, err
	}

	if events == nil {
		events = []*domain.Event{}
	}

	fmt.Println("events", events)

	return &ports.FindEventsResult{
		Events:     events,
		TotalCount: totalCount,
	}, nil
}

func (r *mongoEventRepository) FindData(eventID primitive.ObjectID, name, chip, dorsal, category, sex, position *string, page int, limit int) (*ports.FindParticipantsResult, error) {
	filter := bson.M{"eventId": eventID}
	if name != nil {
		filter["data.Nombre"] = bson.M{"$regex": *name, "$options": "i"}
	}
	if chip != nil {
		filter["data.Chip"] = bson.M{"$regex": *chip, "$options": "i"}
	}
	if dorsal != nil {
		filter["data.Dorsal"] = bson.M{"$regex": *dorsal, "$options": "i"}
	}
	if category != nil {
		filter["data.Categoría"] = bson.M{"$regex": *category, "$options": "i"}
	}
	if sex != nil {
		filter["data.Sexo"] = bson.M{"$regex": *sex, "$options": "i"}
	}
	if position != nil {
		filter["data.POSICION"] = bson.M{"$regex": *position, "$options": "i"}
	}

	totalCount, err := r.getEventDataCollection().CountDocuments(context.Background(), filter)
	if err != nil {
		return nil, err
	}

	findOptions := options.Find()
	findOptions.SetSkip(int64((page - 1) * limit))
	findOptions.SetLimit(int64(limit))
	findOptions.SetSort(bson.D{{Key: "data.POSICION", Value: 1}, {Key: "data.General", Value: 1}})

	cursor, err := r.getEventDataCollection().Find(context.Background(), filter, findOptions)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	var participants []*domain.EventData
	if err = cursor.All(context.Background(), &participants); err != nil {
		return nil, err
	}

	if participants == nil {
		participants = []*domain.EventData{}
	}

	return &ports.FindParticipantsResult{
		Participants: participants,
		TotalCount:   totalCount,
	}, nil
}

func (r *mongoEventRepository) FindByID(id primitive.ObjectID) (*domain.Event, error) {
	var event domain.Event
	err := r.getEventCollection().FindOne(context.Background(), bson.M{"_id": id}).Decode(&event)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}
	return &event, nil
}

func (r *mongoEventRepository) Update(id primitive.ObjectID, event *domain.Event) error {
	_, err := r.getEventCollection().UpdateOne(
		context.Background(),
		bson.M{"_id": id},
		bson.M{"$set": bson.M{
			"name":          event.Name,
			"date":          event.Date,
			"time":          event.Time,
			"address":       event.Address,
			"imageUrl":      event.ImageURL,
			"fileName":      event.FileName,
			"fileExtension": event.FileExtension,
			"status":        event.Status,
		}},
	)
	return err
}

func (r *mongoEventRepository) Delete(id primitive.ObjectID) error {
	// First delete all associated event data
	if err := r.DeleteEventData(id); err != nil {
		return fmt.Errorf("could not delete event data: %w", err)
	}

	// Then delete the event itself
	_, err := r.getEventCollection().DeleteOne(context.Background(), bson.M{"_id": id})
	return err
}

func (r *mongoEventRepository) UpdateStatus(id primitive.ObjectID, status string) error {
	_, err := r.getEventCollection().UpdateOne(
		context.Background(),
		bson.M{"_id": id},
		bson.M{"$set": bson.M{"status": status}},
	)
	return err
}
