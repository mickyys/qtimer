package services

import "errors"

var (
	ErrFileHashMismatch      = errors.New("file hash mismatch")
	ErrInvalidFileExtension  = errors.New("invalid file extension")
)
