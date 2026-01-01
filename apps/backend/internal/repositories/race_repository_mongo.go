package repositories

import (
	"backend/internal/core/domain"
	"backend/internal/core/ports"
	"context"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type mongoRaceRepository struct {
	db     *mongo.Client
	dbName string
}

func NewMongoRaceRepository(db *mongo.Client) ports.RaceRepository {
	return &mongoRaceRepository{
		db:     db,
		dbName: os.Getenv("MONGO_DATABASE"),
	}
}

func (r *mongoRaceRepository) getRaceCollection() *mongo.Collection {
	return r.db.Database(r.dbName).Collection("races")
}

func (r *mongoRaceRepository) Save(race *domain.Race) error {
	race.CreatedAt = time.Now()
	_, err := r.getRaceCollection().InsertOne(context.Background(), race)
	return err
}

func (r *mongoRaceRepository) SaveAll(races []domain.Race) error {
	if len(races) == 0 {
		return nil
	}

	docs := make([]interface{}, len(races))
	for i := range races {
		races[i].CreatedAt = time.Now()
		docs[i] = races[i]
	}

	_, err := r.getRaceCollection().InsertMany(context.Background(), docs)
	return err
}

func (r *mongoRaceRepository) FindByEventID(eventID primitive.ObjectID) ([]*domain.Race, error) {
	ctx := context.Background()
	filter := bson.M{"eventId": eventID}
	opts := options.Find().SetSort(bson.D{{"order", 1}})

	cursor, err := r.getRaceCollection().Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var races []*domain.Race
	if err = cursor.All(ctx, &races); err != nil {
		return nil, err
	}

	return races, nil
}

func (r *mongoRaceRepository) FindByEventIDAndName(eventID primitive.ObjectID, name string) (*domain.Race, error) {
	var race domain.Race
	filter := bson.M{
		"eventId": eventID,
		"name":    name,
	}

	err := r.getRaceCollection().FindOne(context.Background(), filter).Decode(&race)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}
	return &race, nil
}

func (r *mongoRaceRepository) DeleteByEventID(eventID primitive.ObjectID) error {
	filter := bson.M{"eventId": eventID}
	_, err := r.getRaceCollection().DeleteMany(context.Background(), filter)
	return err
}
