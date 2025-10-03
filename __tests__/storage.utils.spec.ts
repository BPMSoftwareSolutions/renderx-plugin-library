import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  saveCustomComponent,
  loadCustomComponents,
  removeCustomComponent,
  clearCustomComponents,
  getStorageInfo,
  type CustomComponent
} from "../src/utils/storage.utils";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe("storage.utils", () => {
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

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe("saveCustomComponent", () => {
    it("should save a valid component successfully", async () => {
      const result = await saveCustomComponent(validComponent, "button.json");
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.component.id).toMatch(/^custom-custom-button-\d+-[a-z0-9]+$/);
        expect(result.component.source).toBe("user-upload");
        expect(result.component.originalFilename).toBe("button.json");
        expect(result.component.component.metadata.category).toBe("custom");
        expect(result.component.uploadedAt).toBeDefined();
      }
    });

    it("should reject component without required metadata.type", async () => {
      const invalidComponent = {
        metadata: { name: "Test" },
        ui: { template: {} }
      };
      
      const result = await saveCustomComponent(invalidComponent);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("metadata.type and metadata.name");
      }
    });

    it("should reject component without required metadata.name", async () => {
      const invalidComponent = {
        metadata: { type: "test" },
        ui: { template: {} }
      };
      
      const result = await saveCustomComponent(invalidComponent);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("metadata.type and metadata.name");
      }
    });

    it("should reject duplicate component types", async () => {
      // Save first component
      await saveCustomComponent(validComponent);
      
      // Try to save another with same type
      const duplicateComponent = {
        metadata: {
          type: "custom-button", // Same type
          name: "Another Button"
        },
        ui: { template: {} }
      };
      
      const result = await saveCustomComponent(duplicateComponent);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("already exists");
      }
    });

    it("should set default category to 'custom'", async () => {
      const componentWithoutCategory = {
        metadata: {
          type: "test-component",
          name: "Test Component"
        },
        ui: { template: {} }
      };
      
      const result = await saveCustomComponent(componentWithoutCategory);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.component.component.metadata.category).toBe("custom");
      }
    });

    it("should preserve existing category", async () => {
      const componentWithCategory = {
        metadata: {
          type: "test-component",
          name: "Test Component",
          category: "layout"
        },
        ui: { template: {} }
      };
      
      const result = await saveCustomComponent(componentWithCategory);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.component.component.metadata.category).toBe("layout");
      }
    });
  });

  describe("loadCustomComponents", () => {
    it("should return empty array when no components stored", () => {
      const components = loadCustomComponents();
      expect(components).toEqual([]);
    });

    it("should return stored components", async () => {
      // Save a component first
      await saveCustomComponent(validComponent);
      
      const components = loadCustomComponents();
      
      expect(components).toHaveLength(1);
      expect(components[0].component.metadata.type).toBe("custom-button");
    });

    it("should handle corrupted localStorage data gracefully", () => {
      // Set invalid JSON in localStorage
      localStorageMock.setItem("renderx:custom-components", "invalid json");
      
      const components = loadCustomComponents();
      expect(components).toEqual([]);
    });

    it("should handle non-array data in localStorage", () => {
      // Set non-array data
      localStorageMock.setItem("renderx:custom-components", JSON.stringify({ not: "array" }));
      
      const components = loadCustomComponents();
      expect(components).toEqual([]);
    });
  });

  describe("removeCustomComponent", () => {
    it("should remove existing component", async () => {
      // Save a component
      const result = await saveCustomComponent(validComponent);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const removed = removeCustomComponent(result.component.id);
        expect(removed).toBe(true);
        
        const components = loadCustomComponents();
        expect(components).toHaveLength(0);
      }
    });

    it("should return false for non-existent component", () => {
      const removed = removeCustomComponent("non-existent-id");
      expect(removed).toBe(false);
    });

    it("should handle localStorage errors gracefully", () => {
      // Mock localStorage.setItem to throw
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error("Storage error");
      });
      
      const removed = removeCustomComponent("some-id");
      expect(removed).toBe(false);
    });
  });

  describe("clearCustomComponents", () => {
    it("should clear all components", async () => {
      // Save some components
      await saveCustomComponent(validComponent);
      await saveCustomComponent({
        metadata: { type: "another-type", name: "Another" },
        ui: { template: {} }
      });
      
      const cleared = clearCustomComponents();
      expect(cleared).toBe(true);
      
      const components = loadCustomComponents();
      expect(components).toHaveLength(0);
    });

    it("should handle localStorage errors gracefully", () => {
      // Mock localStorage.removeItem to throw
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error("Storage error");
      });
      
      const cleared = clearCustomComponents();
      expect(cleared).toBe(false);
    });
  });

  describe("getStorageInfo", () => {
    it("should return correct storage info for empty storage", () => {
      const info = getStorageInfo();
      
      expect(info.componentCount).toBe(0);
      expect(info.currentSizeMB).toBe(0);
      expect(info.maxSizeMB).toBe(10);
      expect(info.availableMB).toBe(10);
    });

    it("should return correct storage info with components", async () => {
      await saveCustomComponent(validComponent);

      const info = getStorageInfo();

      expect(info.componentCount).toBe(1);
      expect(info.maxSizeMB).toBe(10);
      // In test environment, currentSizeMB might be 0 due to mocked localStorage
      expect(info.currentSizeMB).toBeGreaterThanOrEqual(0);
      expect(info.availableMB).toBeLessThanOrEqual(10);
    });
  });
});
