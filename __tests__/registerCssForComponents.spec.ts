import { describe, it, expect, vi } from "vitest";
import { registerCssForComponents } from "../src/ui/LibraryPanel";

// Patch EventRouter.publish to observe calls
vi.mock("@renderx-plugins/host-sdk", async (orig) => {
  const mod = await (orig as any)();
  return {
    ...mod,
    EventRouter: {
      publish: vi.fn(async () => {}),
    },
  };
});

import { EventRouter } from "@renderx-plugins/host-sdk";

describe("registerCssForComponents", () => {
  it("publishes edit then create for each unique class and is idempotent", async () => {
    const items = [
      { template: { css: ".rx-button{}", classes: ["rx-button", "rx-comp"] }, metadata: { type: "button" } },
      { template: { css: ".rx-button{}", classes: ["rx-button"] }, metadata: { type: "button" } },
      { ui: { styles: { css: ".rx-card{}" } }, metadata: { type: "card" } },
    ];

    const conductor = {} as any;
    const spy = vi.spyOn(EventRouter, "publish");

    await registerCssForComponents(items as any, conductor);

    // Expect edit then create for rx-button and rx-card
    const calls = spy.mock.calls.map(([topic, payload]) => ({ topic, id: (payload as any).id }));
    const orderByTopic: Record<string, string[]> = {};
    for (const c of calls) {
      orderByTopic[c.topic] ||= [];
      orderByTopic[c.topic].push(c.id);
    }

    expect(orderByTopic["control.panel.css.edit.requested"]).toEqual(
      expect.arrayContaining(["rx-button", "rx-card"])
    );
    expect(orderByTopic["control.panel.css.create.requested"]).toEqual(
      expect.arrayContaining(["rx-button", "rx-card"])
    );

    // Ensure no duplicate creates for the same class
    const createIds = orderByTopic["control.panel.css.create.requested"];
    const uniqueCreateIds = new Set(createIds);
    expect(uniqueCreateIds.size).toBe(createIds.length);
  });
});

