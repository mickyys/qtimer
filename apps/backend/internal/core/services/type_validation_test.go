package services

import (
	"testing"
	"time"
)

func TestParseDataValue(t *testing.T) {
	tests := []struct {
		name      string
		input     string
		fieldName string
		expected  interface{}
	}{
		{
			name:      "Empty string",
			input:     "",
			fieldName: "SOME_FIELD",
			expected:  "",
		},
		{
			name:      "Integer positive",
			input:     "123",
			fieldName: "POSICION",
			expected:  123,
		},
		{
			name:      "Float positive",
			input:     "12.34",
			fieldName: "SOME_NUMERIC",
			expected:  12.34,
		},
		{
			name:      "Time format MM:SS",
			input:     "12:34",
			fieldName: "TIEMPO",
			expected:  "12:34",
		},
		{
			name:      "Boolean true",
			input:     "true",
			fieldName: "SOME_BOOL",
			expected:  true,
		},
		{
			name:      "Normal string",
			input:     "Juan Pérez",
			fieldName: "NOMBRE",
			expected:  "Juan Pérez",
		},
		{
			name:      "Sexo F should remain string",
			input:     "F",
			fieldName: "SEXO",
			expected:  "F",
		},
		{
			name:      "Sexo M should remain string",
			input:     "M",
			fieldName: "SEXO",
			expected:  "M",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parseDataValue(tt.input, tt.fieldName)

			// Para fechas, comparar usando Equal
			if expectedTime, ok := tt.expected.(time.Time); ok {
				if resultTime, ok := result.(time.Time); ok {
					if !expectedTime.Equal(resultTime) {
						t.Errorf("parseDataValue(%q) = %v, expected %v", tt.input, result, tt.expected)
					}
				} else {
					t.Errorf("parseDataValue(%q) = %v (type %T), expected time.Time", tt.input, result, result)
				}
			} else {
				if result != tt.expected {
					t.Errorf("parseDataValue(%q) = %v (type %T), expected %v (type %T)",
						tt.input, result, result, tt.expected, tt.expected)
				}
			}
		})
	}
}

func TestValidateAndConvertData(t *testing.T) {
	input := map[string]string{
		"NOMBRE":    "Juan Pérez",
		"EDAD":      "25",
		"TIEMPO":    "01:23:45",
		"ACTIVO":    "true",
		"CATEGORIA": "M",
		"POSICION":  "1",
		"CHIP":      "12345",
	}

	result := validateAndConvertData(input)

	// Verificar tipos
	if _, ok := result["NOMBRE"].(string); !ok {
		t.Errorf("NOMBRE should be string, got %T", result["NOMBRE"])
	}

	if _, ok := result["EDAD"].(int); !ok {
		t.Errorf("EDAD should be int, got %T", result["EDAD"])
	}

	if _, ok := result["TIEMPO"].(string); !ok {
		t.Errorf("TIEMPO should be string, got %T", result["TIEMPO"])
	}

	if _, ok := result["ACTIVO"].(bool); !ok {
		t.Errorf("ACTIVO should be bool, got %T", result["ACTIVO"])
	}

	if _, ok := result["POSICION"].(int); !ok {
		t.Errorf("POSICION should be int, got %T", result["POSICION"])
	}

	if _, ok := result["CHIP"].(string); !ok {
		t.Errorf("CHIP should be string, got %T", result["CHIP"])
	}

	// Verificar algunos valores
	if result["NOMBRE"] != "Juan Pérez" {
		t.Errorf("NOMBRE = %v, expected 'Juan Pérez'", result["NOMBRE"])
	}

	if result["EDAD"] != 25 {
		t.Errorf("EDAD = %v, expected 25", result["EDAD"])
	}

	if result["ACTIVO"] != true {
		t.Errorf("ACTIVO = %v, expected true", result["ACTIVO"])
	}

	if result["CHIP"] != "12345" {
		t.Errorf("CHIP = %v, expected '12345'", result["CHIP"])
	}
}
