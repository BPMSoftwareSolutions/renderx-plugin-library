import { describe, it, expect } from "vitest";
import { groupComponentsByCategory, getCategoryDisplayName, varsToStyle, pickDataAttrs } from "../src/utils/library.utils.js";

describe("library.utils", () => {
  it("groups components by category (template attr, metadata, default)", () => {
    const components = [
      { template: { attributes: { "data-category": "layout" } } },
      { metadata: { category: "form" } },
      { },
    ];
    const grouped = groupComponentsByCategory(components as any);
    expect(Object.keys(grouped)).toEqual(expect.arrayContaining(["layout", "form", "basic"]));
    expect(grouped.layout).toHaveLength(1);
    expect(grouped.form).toHaveLength(1);
    expect(grouped.basic).toHaveLength(1);
  });

  it("sorts categories with custom first", () => {
    const components = [
      { metadata: { category: "basic" } },
      { metadata: { category: "custom" } },
      { metadata: { category: "layout" } },
      { metadata: { category: "unknown" } },
    ];
    const grouped = groupComponentsByCategory(components as any);
    const categories = Object.keys(grouped);

    // Custom should be first
    expect(categories[0]).toBe("custom");

    // Known categories should come before unknown ones
    const customIndex = categories.indexOf("custom");
    const basicIndex = categories.indexOf("basic");
    const layoutIndex = categories.indexOf("layout");
    const unknownIndex = categories.indexOf("unknown");

    expect(customIndex).toBeLessThan(basicIndex);
    expect(basicIndex).toBeLessThan(unknownIndex);
    expect(layoutIndex).toBeLessThan(unknownIndex);
  });

  it("getCategoryDisplayName maps known and formats unknown", () => {
    expect(getCategoryDisplayName("basic")).toBe("Basic Components");
    expect(getCategoryDisplayName("custom")).toBe("Custom Components");
    expect(getCategoryDisplayName("layout")).toBe("Layout Components");
    expect(getCategoryDisplayName("unknown")).toBe("Unknown Components");
  });

  it("varsToStyle copies entries verbatim for CSS vars", () => {
    const style = varsToStyle({ "--x": "1", color: "red" } as any) as any;
    expect(style["--x"]).toBe("1");
    expect(style.color).toBe("red");
  });

  it("pickDataAttrs returns only data-* keys", () => {
    const out = pickDataAttrs({ "data-a": "1", id: "x", "data-b": "2" } as any);
    expect(out).toEqual({ "data-a": "1", "data-b": "2" });
  });
});

