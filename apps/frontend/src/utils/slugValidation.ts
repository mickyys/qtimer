/**
 * Validates and generates slugs for event names
 */

/**
 * Removes accents from Spanish characters
 * Maps accented characters to their non-accented equivalents
 */
function removeAccents(input: string): string {
  const accentMap: Record<string, string> = {
    á: "a",
    à: "a",
    ä: "a",
    â: "a",
    ã: "a",
    å: "a",
    é: "e",
    è: "e",
    ë: "e",
    ê: "e",
    í: "i",
    ì: "i",
    ï: "i",
    î: "i",
    ó: "o",
    ò: "o",
    ö: "o",
    ô: "o",
    õ: "o",
    ø: "o",
    ú: "u",
    ù: "u",
    ü: "u",
    û: "u",
    ñ: "n",
    ç: "c",
  };

  return input
    .split("")
    .map((char) => accentMap[char] || char)
    .join("");
}

/**
 * Generates a URL-friendly slug from a string
 * - Converts to lowercase
 * - Removes accents
 * - Replaces spaces and special characters with hyphens
 * - Removes leading and trailing hyphens
 *
 * @param input - The string to convert to a slug
 * @returns The generated slug
 */
export function generateSlug(input: string): string {
  // Convert to lowercase
  let slug = input.toLowerCase();

  // Remove accents
  slug = removeAccents(slug);

  // Replace spaces and special characters with hyphens
  slug = slug.replace(/[^a-z0-9]+/g, "-");

  // Remove leading and trailing hyphens
  slug = slug.replace(/^-+|-+$/g, "");

  return slug;
}

/**
 * Validates if a string is a valid slug format
 * Valid slugs:
 * - Contain only lowercase letters, numbers, and hyphens
 * - Do not start or end with hyphens
 * - May contain consecutive numbers or letters separated by hyphens
 *
 * @param slug - The slug to validate
 * @returns True if the slug is valid, false otherwise
 */
export function isValidSlug(slug: string): boolean {
  if (!slug) {
    return false;
  }

  // Check if slug contains only lowercase letters, numbers, and hyphens
  // Should not start or end with hyphens
  const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

/**
 * Validates if a string can be converted to a valid slug
 * This checks if the input, when processed into a slug, would be valid
 *
 * @param input - The input string to validate
 * @returns An object with isValid boolean and message string
 */
export function validateSlugInput(
  input: string
): { isValid: boolean; message: string; slug: string } {
  if (!input || input.trim().length === 0) {
    return {
      isValid: false,
      message: "El nombre del evento no puede estar vacío",
      slug: "",
    };
  }

  const slug = generateSlug(input);

  if (!slug) {
    return {
      isValid: false,
      message:
        "El nombre del evento debe contener al menos un carácter válido (letras o números)",
      slug: "",
    };
  }

  if (!isValidSlug(slug)) {
    return {
      isValid: false,
      message:
        "El nombre del evento generaría un slug inválido. Use letras, números y espacios únicamente.",
      slug,
    };
  }

  return {
    isValid: true,
    message: "",
    slug,
  };
}
