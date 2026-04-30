package repositories

import (
	"context"
	"fmt"
	"os"
	"regexp"
	"strconv"
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

// parseSearchValue intenta convertir un valor de búsqueda string a número si es posible
func parseSearchValue(value string) (interface{}, error) {
	// Intentar parsear como entero
	if intVal, err := strconv.Atoi(value); err == nil {
		return intVal, nil
	}

	// Intentar parsear como float
	if floatVal, err := strconv.ParseFloat(value, 64); err == nil {
		return floatVal, nil
	}

	return nil, fmt.Errorf("cannot parse as number")
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

func (r *mongoEventRepository) FindBySlug(slug string) (*domain.Event, error) {
	var event domain.Event
	err := r.getEventCollection().FindOne(context.Background(), bson.M{"slug": slug}).Decode(&event)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}
	return &event, nil
}

func (r *mongoEventRepository) FindByFileHash(hash string) (*domain.Event, error) {
	var event domain.Event
	err := r.getEventCollection().FindOne(context.Background(), bson.M{"fileHash": hash}).Decode(&event)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}
	return &event, nil
}

func (r *mongoEventRepository) FindByFileName(fileName string) (*domain.Event, error) {
	var event domain.Event
	err := r.getEventCollection().FindOne(context.Background(), bson.M{"fileName": fileName}).Decode(&event)
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

func (r *mongoEventRepository) UpdateFileStats(id primitive.ObjectID, hash string, uniqueModalities []string, uniqueCategories []string, recordsCount int) error {
	_, err := r.getEventCollection().UpdateOne(
		context.Background(),
		bson.M{"_id": id},
		bson.M{"$set": bson.M{
			"fileHash":         hash,
			"uniqueModalities": uniqueModalities,
			"uniqueCategories": uniqueCategories,
			"recordsCount":     recordsCount,
		}},
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

func (r *mongoEventRepository) FindData(eventID primitive.ObjectID, name, chip, dorsal, category, distance, sex, position *string, page int, limit int) (*ports.FindParticipantsResult, error) {
	filter := bson.M{"eventId": eventID}
	var orConditions []bson.M

	// Para nombre, buscar en múltiples campos con case-insensitive
	if name != nil {
		nameRegex := bson.M{"$regex": *name, "$options": "i"}
		orConditions = append(orConditions,
			bson.M{"data.Nombre": nameRegex},
			bson.M{"data.NOMBRE": nameRegex},
			bson.M{"data.name": nameRegex},
			bson.M{"data.nombre": nameRegex},
		)
	}

	// Para categoría, buscar en múltiples campos con coincidencia exacta (case-insensitive)
	if category != nil {
		orConditions = append(orConditions,
			bson.M{"data.Categoría": bson.M{"$regex": "^" + *category + "$", "$options": "i"}},
			bson.M{"data.CATEGORIA": bson.M{"$regex": "^" + *category + "$", "$options": "i"}},
			bson.M{"data.category": bson.M{"$regex": "^" + *category + "$", "$options": "i"}},
			bson.M{"data.categoria": bson.M{"$regex": "^" + *category + "$", "$options": "i"}},
		)
	}

	// Para distancia, buscar en múltiples campos con coincidencia exacta (case-insensitive)
	if distance != nil {
		orConditions = append(orConditions,
			bson.M{"data.MODALIDAD": bson.M{"$regex": "^" + *distance + "$", "$options": "i"}},
			bson.M{"data.distance": bson.M{"$regex": "^" + *distance + "$", "$options": "i"}},
			bson.M{"data.distancia": bson.M{"$regex": "^" + *distance + "$", "$options": "i"}},
		)
	}

	// Para sexo, buscar en múltiples campos con case-insensitive
	if sex != nil {
		sexRegex := bson.M{"$regex": *sex, "$options": "i"}
		orConditions = append(orConditions,
			bson.M{"data.Sexo": sexRegex},
			bson.M{"data.SEXO": sexRegex},
			bson.M{"data.sex": sexRegex},
		)
	}

	// Para chip, dorsal y posición, buscar tanto como string como número
	if chip != nil {
		if chipNum, err := parseSearchValue(*chip); err == nil {
			orConditions = append(orConditions,
				bson.M{"data.Chip": chipNum},
				bson.M{"data.Chip": bson.M{"$regex": *chip, "$options": "i"}},
			)
		} else {
			filter["data.Chip"] = bson.M{"$regex": *chip, "$options": "i"}
		}
	}
	if dorsal != nil {
		if dorsalNum, err := parseSearchValue(*dorsal); err == nil {
			// Si es numérico, buscar como número y también como string
			orConditions = append(orConditions,
				bson.M{"data.Dorsal": dorsalNum},
				bson.M{"data.DORSAL": dorsalNum},
				bson.M{"data.dorsal": dorsalNum},
				bson.M{"data.Dorsal": *dorsal},
				bson.M{"data.DORSAL": *dorsal},
				bson.M{"data.dorsal": *dorsal},
			)
		} else {
			// Búsqueda exacta case-insensitive usando regex con ^...$ para asegurar coincidencia completa
			escapedDorsal := regexp.QuoteMeta(*dorsal)
			orConditions = append(orConditions,
				bson.M{"data.Dorsal": bson.M{"$regex": "^" + escapedDorsal + "$", "$options": "i"}},
				bson.M{"data.DORSAL": bson.M{"$regex": "^" + escapedDorsal + "$", "$options": "i"}},
				bson.M{"data.dorsal": bson.M{"$regex": "^" + escapedDorsal + "$", "$options": "i"}},
			)
		}
	}
	if position != nil {
		if posNum, err := parseSearchValue(*position); err == nil {
			orConditions = append(orConditions,
				bson.M{"data.POSICION": posNum},
				bson.M{"data.POSICION": bson.M{"$regex": *position, "$options": "i"}},
			)
		} else {
			filter["data.POSICION"] = bson.M{"$regex": *position, "$options": "i"}
		}
	}

	// Si hay condiciones OR, agregarlas al filtro
	if len(orConditions) > 0 {
		if existingOr, ok := filter["$or"]; ok {
			// Combinar con condiciones OR existentes
			filter["$or"] = append(existingOr.([]bson.M), orConditions...)
		} else {
			filter["$or"] = orConditions
		}
	}

	totalCount, err := r.getEventDataCollection().CountDocuments(context.Background(), filter)
	if err != nil {
		return nil, err
	}

	// Usar agregación para ordenar correctamente la posición como número
	pipeline := []bson.M{
		{"$match": filter},
		{
			"$addFields": bson.M{
				"posicionNumerica": bson.M{
					"$toInt": bson.M{
						"$ifNull": []interface{}{"$data.POSICION", 999999},
					},
				},
			},
		},
		{"$sort": bson.M{"data.MODALIDAD": 1, "posicionNumerica": 1, "_id": 1}},
		{"$skip": int64((page - 1) * limit)},
		{"$limit": int64(limit)},
		{"$project": bson.M{"posicionNumerica": 0}}, // Remover campo temporal
	}

	cursor, err := r.getEventDataCollection().Aggregate(context.Background(), pipeline)
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
			"name":             event.Name,
			"slug":             event.Slug,
			"date":             event.Date,
			"time":             event.Time,
			"address":          event.Address,
			"imageUrl":         event.ImageURL,
			"fileName":         event.FileName,
			"fileExtension":    event.FileExtension,
			"status":           event.Status,
			"fileHash":         event.FileHash,
			"uniqueModalities": event.UniqueModalities,
			"uniqueCategories": event.UniqueCategories,
			"recordsCount":     event.RecordsCount,
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

// GetParticipantComparison obtiene el 1er lugar y los 5 participantes anteriores
func (r *mongoEventRepository) GetParticipantComparison(eventID primitive.ObjectID, bib string, distance string, category string) (*ports.ComparisonResult, error) {
	collection := r.getEventDataCollection()

	// Filtro para obtener participantes de la misma distancia y categoría
	distanceFilter := bson.M{
		"eventId": eventID,
		"$and": []bson.M{
			{
				"$or": []bson.M{
					bson.M{"data.MODALIDAD": bson.M{"$regex": "^" + distance + "$", "$options": "i"}},
					bson.M{"data.distance": bson.M{"$regex": "^" + distance + "$", "$options": "i"}},
					bson.M{"data.distancia": bson.M{"$regex": "^" + distance + "$", "$options": "i"}},
				},
			},
			{
				"$or": []bson.M{
					bson.M{"data.CATEGORIA": bson.M{"$regex": "^" + category + "$", "$options": "i"}},
					bson.M{"data.Categoría": bson.M{"$regex": "^" + category + "$", "$options": "i"}},
					bson.M{"data.category": bson.M{"$regex": "^" + category + "$", "$options": "i"}},
					bson.M{"data.categoria": bson.M{"$regex": "^" + category + "$", "$options": "i"}},
				},
			},
		},
	}

	// Obtener todos los participantes de la misma distancia, ordenados por posición
	opts := options.Find().SetSort(bson.D{
		{Key: "data.POSICION", Value: 1},
	})
	cursor, err := collection.Find(context.Background(), distanceFilter, opts)
	if err != nil {
		return nil, fmt.Errorf("could not find participants: %w", err)
	}
	defer cursor.Close(context.Background())

	var allParticipants []*domain.EventData
	if err := cursor.All(context.Background(), &allParticipants); err != nil {
		return nil, fmt.Errorf("could not decode participants: %w", err)
	}

	result := &ports.ComparisonResult{
		FirstPlace:           nil,
		PreviousParticipants: []*domain.EventData{},
	}

	if len(allParticipants) == 0 {
		return result, nil
	}

	// Buscar el participante seleccionado por dorsal
	var selectedIndex = -1
	for i, p := range allParticipants {
		bibValue := getBibValue(p.Data)
		if bibValue == bib {
			selectedIndex = i
			break
		}
	}

	// Si no se encuentra el participante, devolver sin datos
	if selectedIndex == -1 {
		return result, nil
	}

	// Obtener los 5 anteriores (máximo)
	startIndex := 0
	if selectedIndex > 5 {
		startIndex = selectedIndex - 5
	}

	// Agregar los participantes anteriores
	previousParticipantsSet := make(map[string]*domain.EventData)
	for i := startIndex; i < selectedIndex; i++ {
		bibVal := getBibValue(allParticipants[i].Data)
		previousParticipantsSet[bibVal] = allParticipants[i]
		result.PreviousParticipants = append(result.PreviousParticipants, allParticipants[i])
	}

	// Obtener el 1er lugar (siempre es el primero)
	if len(allParticipants) > 0 {
		result.FirstPlace = allParticipants[0]
	}

	return result, nil
}

// getBibValue extrae el valor del dorsal de múltiples campos posibles
func getBibValue(data map[string]interface{}) string {
	possibleKeys := []string{"DORSAL", "dorsal", "bib", "Dorsal", "Bib"}

	for _, key := range possibleKeys {
		if val, ok := data[key]; ok {
			switch v := val.(type) {
			case string:
				return v
			case float64:
				return strconv.FormatFloat(v, 'f', 0, 64)
			case int:
				return strconv.Itoa(v)
			case int32:
				return strconv.Itoa(int(v))
			case int64:
				return strconv.FormatInt(v, 10)
			}
		}
	}

	return ""
}
