package utils

import (
	"regexp"
	"strings"
)

// GenerateSlug converts a string into a URL-friendly slug
func GenerateSlug(input string) string {
	// Convert to lowercase
	slug := strings.ToLower(input)

	// Remove/replace special characters from Spanish
	slug = removeAccents(slug)

	// Replace spaces and special characters with hyphens
	reg := regexp.MustCompile(`[^a-z0-9]+`)
	slug = reg.ReplaceAllString(slug, "-")

	// Remove leading and trailing hyphens
	slug = strings.Trim(slug, "-")

	return slug
}

// removeAccents removes accents from Spanish characters
func removeAccents(input string) string {
	// Map of accented characters to their non-accented equivalents
	accentMap := map[rune]rune{
		'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a', 'ã': 'a', 'å': 'a',
		'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e',
		'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i',
		'ó': 'o', 'ò': 'o', 'ö': 'o', 'ô': 'o', 'õ': 'o', 'ø': 'o',
		'ú': 'u', 'ù': 'u', 'ü': 'u', 'û': 'u',
		'ñ': 'n',
		'ç': 'c',
	}

	var result strings.Builder
	for _, char := range input {
		if replacement, found := accentMap[char]; found {
			result.WriteRune(replacement)
		} else {
			result.WriteRune(char)
		}
	}

	return result.String()
}

// IsValidSlug checks if a string is a valid slug format
func IsValidSlug(slug string) bool {
	if slug == "" {
		return false
	}

	// Check if slug contains only lowercase letters, numbers, and hyphens
	// Should not start or end with hyphens
	reg := regexp.MustCompile(`^[a-z0-9]+(-[a-z0-9]+)*$`)
	return reg.MatchString(slug)
}
