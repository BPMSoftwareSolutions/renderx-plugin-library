import { describe, it, expect } from "vitest";
import {
  validateComponentJson,
  normalizeComponent,
  validateAndParseJson,
  validateFile,
  type ValidationResult
} from "../src/utils/validation.utils";

describe("validation.utils", () => {
  const validComponent = {
    metadata: {
      type: "custom-button",
      name: "Custom Button",
      description: "A custom button component"
    },
    ui: {
      template: { tag: "button", text: "Click me" }
    }
  };

  describe("validateComponentJson", () => {
    it("should validate a correct component", () => {
      const result = validateComponentJson(validComponent);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.normalizedComponent).toBeDefined();
    });

    it("should reject non-object input", () => {
      const result = validateComponentJson("not an object");
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Component must be a valid JSON object");
    });

    it("should reject null input", () => {
      const result = validateComponentJson(null);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Component must be a valid JSON object");
    });

    it("should reject array input", () => {
      const result = validateComponentJson([]);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Component must be a valid JSON object");
    });

    it("should require metadata object", () => {
      const component = { ui: { template: {} } };
      const result = validateComponentJson(component);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("metadata is required and must be an object");
    });

    it("should require metadata.type", () => {
      const component = {
        metadata: { name: "Test" },
        ui: { template: {} }
      };
      const result = validateComponentJson(component);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("metadata.type must be a non-empty string");
    });

    it("should require metadata.name", () => {
      const component = {
        metadata: { type: "test" },
        ui: { template: {} }
      };
      const result = validateComponentJson(component);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("metadata.name must be a non-empty string");
    });

    it("should validate metadata.type format", () => {
      const component = {
        metadata: {
          type: "Invalid Type With Spaces",
          name: "Test"
        },
        ui: { template: {} }
      };
      const result = validateComponentJson(component);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("metadata.type should contain only lowercase letters, numbers, and hyphens (e.g., \"custom-button\")");
    });

    it("should accept valid metadata.type format", () => {
      const component = {
        metadata: {
          type: "custom-button-123",
          name: "Test"
        },
        ui: { template: {} }
      };
      const result = validateComponentJson(component);
      
      expect(result.isValid).toBe(true);
    });

    it("should require ui object", () => {
      const component = {
        metadata: { type: "test", name: "Test" }
      };
      const result = validateComponentJson(component);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("ui is required and must be an object");
    });

    it("should require ui to have content", () => {
      const component = {
        metadata: { type: "test", name: "Test" },
        ui: {}
      };
      const result = validateComponentJson(component);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("ui must contain at least one of: template, styles, or html");
    });

    it("should accept ui with template", () => {
      const component = {
        metadata: { type: "test", name: "Test" },
        ui: { template: { tag: "div" } }
      };
      const result = validateComponentJson(component);
      
      expect(result.isValid).toBe(true);
    });

    it("should accept ui with styles", () => {
      const component = {
        metadata: { type: "test", name: "Test" },
        ui: { styles: { css: ".test { color: red; }" } }
      };
      const result = validateComponentJson(component);
      
      expect(result.isValid).toBe(true);
    });

    it("should warn about unknown properties", () => {
      const component = {
        metadata: { type: "test", name: "Test" },
        ui: { template: {} },
        unknownProperty: "value"
      };
      const result = validateComponentJson(component);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain("Unknown properties found: unknownProperty. These will be preserved but may not be used.");
    });

    it("should warn about non-custom category", () => {
      const component = {
        metadata: {
          type: "test",
          name: "Test",
          category: "layout"
        },
        ui: { template: {} }
      };
      const result = validateComponentJson(component);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('metadata.category is "layout" but will be treated as "custom" in the library');
    });

    it("should validate optional fields when present", () => {
      const component = {
        metadata: {
          type: "test",
          name: "Test",
          category: "",  // Empty string should fail
          description: 123  // Wrong type should fail
        },
        ui: { template: {} }
      };
      const result = validateComponentJson(component);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("metadata.category must be a non-empty string");
      expect(result.errors).toContain("metadata.description must be a non-empty string");
    });
  });

  describe("normalizeComponent", () => {
    it("should normalize a component with all fields", () => {
      const component = {
        metadata: {
          type: "  custom-button  ",
          name: "  Custom Button  ",
          category: "  layout  ",
          description: "  A button  "
        },
        ui: { template: {} },
        extraField: "preserved"
      };
      
      const normalized = normalizeComponent(component);
      
      expect(normalized.metadata.type).toBe("custom-button");
      expect(normalized.metadata.name).toBe("Custom Button");
      expect(normalized.metadata.category).toBe("layout");
      expect(normalized.metadata.description).toBe("A button");
      expect(normalized.extraField).toBe("preserved");
    });

    it("should set default category and description", () => {
      const component = {
        metadata: {
          type: "test",
          name: "Test Component"
        },
        ui: { template: {} }
      };
      
      const normalized = normalizeComponent(component);
      
      expect(normalized.metadata.category).toBe("custom");
      expect(normalized.metadata.description).toBe("Test Component component");
    });
  });

  describe("validateAndParseJson", () => {
    it("should parse and validate valid JSON", () => {
      const jsonString = JSON.stringify(validComponent);
      const result = validateAndParseJson(jsonString);
      
      expect(result.isValid).toBe(true);
      expect(result.normalizedComponent).toBeDefined();
    });

    it("should reject invalid JSON", () => {
      const result = validateAndParseJson("{ invalid json }");
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Invalid JSON format");
    });

    it("should reject valid JSON with invalid component", () => {
      const invalidComponent = { not: "a component" };
      const jsonString = JSON.stringify(invalidComponent);
      const result = validateAndParseJson(jsonString);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("validateFile", () => {
    it("should validate a correct JSON file", () => {
      const file = new File(['{}'], 'component.json', { type: 'application/json' });
      const result = validateFile(file);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject non-JSON file extension", () => {
      const file = new File(['{}'], 'component.txt', { type: 'text/plain' });
      const result = validateFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("File must have a .json extension");
    });

    it("should reject files that are too large", () => {
      // Create a large file (over 1MB)
      const largeContent = 'x'.repeat(1024 * 1024 + 1);
      const file = new File([largeContent], 'large.json', { type: 'application/json' });
      const result = validateFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("File too large");
      expect(result.errors[0]).toContain("Maximum size is 1MB");
    });

    it("should warn about unexpected MIME type", () => {
      const file = new File(['{}'], 'component.json', { type: 'application/octet-stream' });
      const result = validateFile(file);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('File MIME type is "application/octet-stream". Expected JSON or text file.');
    });

    it("should accept text MIME type", () => {
      const file = new File(['{}'], 'component.json', { type: 'text/plain' });
      const result = validateFile(file);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });
});
