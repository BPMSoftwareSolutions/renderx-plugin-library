import { describe, it, expect, beforeEach, vi } from "vitest";

// Import the library symphony handlers directly from source
import { handlers } from "../src/symphonies/load.symphony";

declare global {
  var window: any;
}

describe("library.handlers", () => {
  beforeEach(() => {
    global.window = global.window || {};
    global.window.RenderX = {};
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

  it("notifyUi calls onComponentsLoaded with payload list", () => {
    const payloadList = [{ id: "json-button" }];
    const spy = vi.fn();
    const ctx: any = { payload: { components: payloadList } };
    handlers.notifyUi({ onComponentsLoaded: spy }, ctx);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(payloadList);
  });
});

