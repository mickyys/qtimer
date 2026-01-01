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
)

type mongoCategoryRepository struct {
	db     *mongo.Client
	dbName string
}

func NewMongoCategoryRepository(db *mongo.Client) ports.CategoryRepository {
	return &mongoCategoryRepository{
		db:     db,
		dbName: os.Getenv("MONGO_DATABASE"),
	}
}

func (r *mongoCategoryRepository) getCategoryCollection() *mongo.Collection {
	return r.db.Database(r.dbName).Collection("categories")
}

func (r *mongoCategoryRepository) Save(category *domain.Category) error {
	category.CreatedAt = time.Now()
	_, err := r.getCategoryCollection().InsertOne(context.Background(), category)
	return err
}

func (r *mongoCategoryRepository) FindOrCreate(name string) (*domain.Category, error) {
	// Primero intentamos encontrar la categoría
	var category domain.Category
	err := r.getCategoryCollection().FindOne(context.Background(), bson.M{"name": name}).Decode(&category)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			// No existe, la creamos
			newCategory := &domain.Category{
				Name:      name,
				CreatedAt: time.Now(),
			}

			result, insertErr := r.getCategoryCollection().InsertOne(context.Background(), newCategory)
			if insertErr != nil {
				return nil, insertErr
			}

			newCategory.ID = result.InsertedID.(primitive.ObjectID)
			return newCategory, nil
		}
		return nil, err
	}

	// Ya existe, la retornamos
	return &category, nil
}

func (r *mongoCategoryRepository) FindAll() ([]*domain.Category, error) {
	ctx := context.Background()
	cursor, err := r.getCategoryCollection().Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var categories []*domain.Category
	if err = cursor.All(ctx, &categories); err != nil {
		return nil, err
	}

	return categories, nil
}
