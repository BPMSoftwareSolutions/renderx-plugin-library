import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock storage utilities
vi.mock("../src/utils/storage.utils", () => ({
  loadCustomComponents: vi.fn(() => [])
}));

// Import the library symphony handlers directly from source
import { handlers } from "../src/symphonies/load.symphony";
import { loadCustomComponents } from "../src/utils/storage.utils";

declare global {
  var window: any;
}

describe("library.handlers", () => {
  beforeEach(() => {
    global.window = global.window || {};
    global.window.RenderX = {};
    vi.clearAllMocks();
    (loadCustomComponents as any).mockReturnValue([]);
  });

  it("loadComponents uses Host SDK inventory when available and assigns payload components", async () => {
    const sample = [{ metadata: { type: "button", name: "Button" }, ui: {} }];
    global.window.RenderX.inventory = {
      async listComponents() {
        return sample;
      },
    };
    const ctx: any = { payload: {} };
    const res = await handlers.loadComponents({}, ctx);
    expect(res).toMatchObject({ count: 1 });
    expect(Array.isArray(ctx.payload.components)).toBe(true);
    expect(ctx.payload.components[0].name).toBe("Button");
  });

  it("loadComponents merges custom components with inventory components", async () => {
    const customComponents = [
      {
        id: "custom-1",
        component: {
          metadata: { type: "custom-button", name: "Custom Button", category: "custom" },
          ui: { template: { tag: "button" } }
        }
      }
    ];

    const inventoryComponents = [
      { metadata: { type: "button", name: "Button" }, ui: {} }
    ];

    (loadCustomComponents as any).mockReturnValue(customComponents);

    global.window.RenderX.inventory = {
      async listComponents() {
        return inventoryComponents;
      },
    };

    const ctx: any = { payload: {} };
    const res = await handlers.loadComponents({}, ctx);

    expect(res).toMatchObject({ count: 2 });
    expect(Array.isArray(ctx.payload.components)).toBe(true);
    expect(ctx.payload.components).toHaveLength(2);

    // Custom component should be first
    expect(ctx.payload.components[0].name).toBe("Custom Button");
    expect(ctx.payload.components[1].name).toBe("Button");
  });

  it("loadComponents works with only custom components when no inventory", async () => {
    const customComponents = [
      {
        id: "custom-1",
        component: {
          metadata: { type: "custom-widget", name: "Custom Widget" },
          ui: { template: { tag: "div" } }
        }
      }
    ];

    (loadCustomComponents as any).mockReturnValue(customComponents);

    // No inventory available - remove RenderX entirely and mock fetch to be undefined
    delete global.window.RenderX;
    const originalFetch = global.fetch;
    delete (global as any).fetch;

    const ctx: any = { payload: {} };
    const res = await handlers.loadComponents({}, ctx);

    // Restore fetch
    if (originalFetch) {
      global.fetch = originalFetch;
    }

    expect(res).toMatchObject({ count: 1 });
    expect(ctx.payload.components[0].name).toBe("Custom Widget");
  });

  it("loadComponents handles empty custom components", async () => {
    (loadCustomComponents as any).mockReturnValue([]);

    const inventoryComponents = [
      { metadata: { type: "button", name: "Button" }, ui: {} }
    ];

    global.window.RenderX.inventory = {
      async listComponents() {
        return inventoryComponents;
      },
    };

    const ctx: any = { payload: {} };
    const res = await handlers.loadComponents({}, ctx);

    expect(res).toMatchObject({ count: 1 });
    expect(ctx.payload.components[0].name).toBe("Button");
  });

  it("notifyUi calls onComponentsLoaded with payload list", () => {
    const payloadList = [{ id: "json-button" }];
    const spy = vi.fn();
    const ctx: any = { payload: { components: payloadList } };
    handlers.notifyUi({ onComponentsLoaded: spy }, ctx);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(payloadList);
  });
});

