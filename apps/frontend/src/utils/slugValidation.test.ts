import {
  generateSlug,
  isValidSlug,
  validateSlugInput,
} from "@/utils/slugValidation";

describe("slugValidation", () => {
  describe("generateSlug", () => {
    it("should convert text to lowercase", () => {
      expect(generateSlug("HELLO WORLD")).toBe("hello-world");
      expect(generateSlug("HeLLo WoRLd")).toBe("hello-world");
    });

    it("should replace spaces with hyphens", () => {
      expect(generateSlug("hello world")).toBe("hello-world");
      expect(generateSlug("hello  world")).toBe("hello-world");
      expect(generateSlug("hello   world")).toBe("hello-world");
    });

    it("should remove accents from Spanish characters", () => {
      expect(generateSlug("Maratón")).toBe("maraton");
      expect(generateSlug("José María")).toBe("jose-maria");
      expect(generateSlug("Málaga")).toBe("malaga");
      expect(generateSlug("Niño")).toBe("nino");
      expect(generateSlug("Área")).toBe("area");
    });

    it("should remove special characters and replace with hyphens", () => {
      expect(generateSlug("hello@world")).toBe("hello-world");
      expect(generateSlug("hello#world")).toBe("hello-world");
      expect(generateSlug("hello$world")).toBe("hello-world");
      expect(generateSlug("hello%world")).toBe("hello-world");
    });

    it("should handle multiple special characters", () => {
      expect(generateSlug("hello!!!world")).toBe("hello-world");
      expect(generateSlug("hello&&&world")).toBe("hello-world");
    });

    it("should remove leading and trailing hyphens", () => {
      expect(generateSlug("  hello world  ")).toBe("hello-world");
      expect(generateSlug("-hello world-")).toBe("hello-world");
      expect(generateSlug("---hello world---")).toBe("hello-world");
    });

    it("should keep numbers", () => {
      expect(generateSlug("Maratón 2024")).toBe("maraton-2024");
      expect(generateSlug("100K 50K")).toBe("100k-50k");
    });

    it("should handle complex real-world examples", () => {
      expect(generateSlug("Maratón de San José 2024")).toBe(
        "maraton-de-san-jose-2024"
      );
      expect(generateSlug("CORRIDA CASABLANCA 2024")).toBe(
        "corrida-casablanca-2024"
      );
      expect(generateSlug("Medio Maratón Metropolitano 2025")).toBe(
        "medio-maraton-metropolitano-2025"
      );
    });

    it("should return empty string for input with no valid characters", () => {
      expect(generateSlug("!!!")).toBe("");
      expect(generateSlug("@@@")).toBe("");
      expect(generateSlug("...")).toBe("");
    });
  });

  describe("isValidSlug", () => {
    it("should return true for valid slugs", () => {
      expect(isValidSlug("hello-world")).toBe(true);
      expect(isValidSlug("hello")).toBe(true);
      expect(isValidSlug("hello-world-2024")).toBe(true);
      expect(isValidSlug("a")).toBe(true);
      expect(isValidSlug("maraton-2024")).toBe(true);
    });

    it("should return false for empty string", () => {
      expect(isValidSlug("")).toBe(false);
    });

    it("should return false for slugs with uppercase letters", () => {
      expect(isValidSlug("Hello-World")).toBe(false);
      expect(isValidSlug("HELLO-WORLD")).toBe(false);
      expect(isValidSlug("hello-World")).toBe(false);
    });

    it("should return false for slugs starting with hyphen", () => {
      expect(isValidSlug("-hello-world")).toBe(false);
      expect(isValidSlug("-hello")).toBe(false);
    });

    it("should return false for slugs ending with hyphen", () => {
      expect(isValidSlug("hello-world-")).toBe(false);
      expect(isValidSlug("hello-")).toBe(false);
    });

    it("should return false for slugs with consecutive hyphens", () => {
      expect(isValidSlug("hello--world")).toBe(false);
      expect(isValidSlug("hello---world")).toBe(false);
    });

    it("should return false for slugs with special characters", () => {
      expect(isValidSlug("hello@world")).toBe(false);
      expect(isValidSlug("hello#world")).toBe(false);
      expect(isValidSlug("hello$world")).toBe(false);
      expect(isValidSlug("hello world")).toBe(false);
    });

    it("should return false for slugs with accents", () => {
      expect(isValidSlug("héllo-world")).toBe(false);
      expect(isValidSlug("maraton-josé")).toBe(false);
    });
  });

  describe("validateSlugInput", () => {
    it("should return valid true for valid inputs", () => {
      const result = validateSlugInput("Hello World");
      expect(result.isValid).toBe(true);
      expect(result.message).toBe("");
      expect(result.slug).toBe("hello-world");
    });

    it("should return valid true for complex real-world inputs", () => {
      const result = validateSlugInput("Maratón de San José 2024");
      expect(result.isValid).toBe(true);
      expect(result.message).toBe("");
      expect(result.slug).toBe("maraton-de-san-jose-2024");
    });

    it("should return isValid false and message for empty input", () => {
      const result = validateSlugInput("");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("vacío");
    });

    it("should return isValid false and message for whitespace-only input", () => {
      const result = validateSlugInput("   ");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("vacío");
    });

    it("should return isValid false for input with only special characters", () => {
      const result = validateSlugInput("!!!");
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("al menos un carácter válido");
    });

    it("should include generated slug in result", () => {
      const result = validateSlugInput("Maratón 2024");
      expect(result.slug).toBe("maraton-2024");
    });
  });
});
