package utils

import (
	"fmt"
	"os"
	"path/filepath"
)

// MoveFile mueve un archivo de una ruta de origen a un directorio de destino.
// Si overwrite es verdadero, reemplazará el archivo de destino si ya existe.
func MoveFile(sourcePath, destDir string, overwrite bool) error {
	// Asegurarse de que el directorio de destino exista
	if err := os.MkdirAll(destDir, 0755); err != nil {
		return fmt.Errorf("failed to create destination directory: %w", err)
	}

	destPath := filepath.Join(destDir, filepath.Base(sourcePath))

	// Comprobar si el archivo de destino existe
	if _, err := os.Stat(destPath); err == nil {
		if !overwrite {
			return fmt.Errorf("destination file %s already exists and overwrite is false", destPath)
		}
		// Eliminar el archivo existente
		if err := os.Remove(destPath); err != nil {
			return fmt.Errorf("failed to remove existing destination file: %w", err)
		}
	}

	// Mover el archivo
	if err := os.Rename(sourcePath, destPath); err != nil {
		return fmt.Errorf("failed to move file: %w", err)
	}

	return nil
}
