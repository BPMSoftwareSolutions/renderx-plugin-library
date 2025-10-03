import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import ReactDOM from "react-dom/client";
import { act } from "react-dom/test-utils";
import { EventRouter } from "@renderx-plugins/host-sdk";

// Mock Host SDK before importing component
const sampleList = [
  {
    id: "json-button",
    name: "Button",
    template: { tag: "button", attributes: { "data-category": "basic" } },
    metadata: { type: "button", name: "Button" },
  },
];

// Mock storage utilities
vi.mock("../src/utils/storage.utils", () => ({
  loadCustomComponents: vi.fn(() => [])
}));

// Mock custom component UI
vi.mock("../src/ui/CustomComponentUpload", () => ({
  CustomComponentUpload: ({ onComponentAdded }: any) =>
    React.createElement("div", {
      "data-testid": "custom-upload",
      onClick: () => onComponentAdded?.()
    }, "Upload Zone")
}));

vi.mock("../src/ui/CustomComponentList", () => ({
  CustomComponentList: ({ components, onComponentRemoved }: any) =>
    React.createElement("div", {
      "data-testid": "custom-list",
      onClick: () => onComponentRemoved?.()
    }, `Custom List (${components.length})`)
}));

vi.mock("@renderx-plugins/host-sdk", () => {
  return {
    EventRouter: {
      publish: vi.fn(async (topic: string, payload: any) => {
        if (topic === "library.load.requested") {
          payload?.onComponentsLoaded?.(sampleList);
        }
      }),
    },
    useConductor: () => ({ play: vi.fn() }),
    resolveInteraction: vi.fn(() => ({ pluginId: "@renderx-plugins/library", sequenceId: "library-load" })),
    isFlagEnabled: () => false,
  };
});

import { LibraryPanel } from "../src/ui/LibraryPanel";
import { loadCustomComponents } from "../src/utils/storage.utils";

function nextTick() {
  return new Promise((r) => setTimeout(r, 0));
}

describe("LibraryPanel", () => {
  let container: HTMLDivElement;
  let root: ReactDOM.Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = ReactDOM.createRoot(container);
  });

  afterEach(() => {
    root.unmount();
    document.body.removeChild(container);
  });

  it("renders header and items from inventory via EventRouter publish", async () => {
    await act(async () => {
      root.render(React.createElement(LibraryPanel));
      await nextTick();
    });

    const text = container.textContent || "";
    expect(text).toContain("Component Library");
    // Verify publish call was made to request inventory
    expect((EventRouter as any).publish).toHaveBeenCalledWith(
      "library.load.requested",
      expect.any(Object),
      expect.anything()
    );
  });

  it("renders custom component upload zone when custom category exists", async () => {
    // Mock custom components to create custom category
    const customComponent = {
      id: "custom-test",
      name: "Custom Test",
      template: { tag: "div" },
      metadata: { type: "custom-test", name: "Custom Test", category: "custom" }
    };

    (EventRouter as any).publish.mockImplementation(async (topic: string, payload: any) => {
      if (topic === "library.load.requested") {
        payload?.onComponentsLoaded?.([customComponent, ...sampleList]);
      }
    });

    await act(async () => {
      root.render(React.createElement(LibraryPanel));
      await nextTick();
    });

    const uploadZone = container.querySelector('[data-testid="custom-upload"]');
    expect(uploadZone).toBeTruthy();
    expect(uploadZone?.textContent).toContain("Upload Zone");
  });

  it("renders custom component list when custom components exist", async () => {
    // Mock loadCustomComponents to return some components
    (loadCustomComponents as any).mockReturnValue([
      {
        id: "test-1",
        component: { metadata: { name: "Test Component" } }
      }
    ]);

    const customComponent = {
      id: "custom-test",
      name: "Custom Test",
      template: { tag: "div" },
      metadata: { type: "custom-test", name: "Custom Test", category: "custom" }
    };

    (EventRouter as any).publish.mockImplementation(async (topic: string, payload: any) => {
      if (topic === "library.load.requested") {
        payload?.onComponentsLoaded?.([customComponent]);
      }
    });

    await act(async () => {
      root.render(React.createElement(LibraryPanel));
      await nextTick();
    });

    const customList = container.querySelector('[data-testid="custom-list"]');
    expect(customList).toBeTruthy();
    expect(customList?.textContent).toContain("Custom List (1)");
  });
});

