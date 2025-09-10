// NOTE: Runtime sequences are mounted from JSON (see json-sequences/*). This file exports handlers for those sequences.
import { mapJsonComponentToTemplate } from "@renderx-plugins/host-sdk";

function mapJsonComponentToTemplateCompat(json: any) {
  const tpl = mapJsonComponentToTemplate(json);
  const type = json?.metadata?.replaces || json?.metadata?.type || "div";
  return {
    id: `json-${type}`,
    name: json?.metadata?.name || type,
    template: tpl,
    metadata: json?.metadata || {},
    // Preserve original UI for CSS extraction in Node/test path
    ui: json?.ui,
  };
}



export const handlers = {
  async loadComponents(_data: any, ctx: any) {
    let list: any[] = [];
    try {
      // Prefer Host SDK inventory bridge if present (browser/dev and tests)
      const g: any = (typeof globalThis !== "undefined" ? globalThis : (window as any));
      const inv = g?.window?.RenderX?.inventory || g?.RenderX?.inventory;
      if (inv && typeof inv.listComponents === "function") {
        const items = await inv.listComponents();
        list = (items || []).map(mapJsonComponentToTemplateCompat);
      } else if (typeof fetch === "function") {
        // Browser/dev fallback: serve from public/json-components using JSON index
        const idxRes = await fetch("/json-components/index.json");
        const idx = idxRes.ok ? await idxRes.json() : { components: [] };
        const files: string[] = idx?.components || [];
        const base = "/json-components/";
        const items: any[] = [];
        for (const f of files) {
          const res = await fetch(base + f);
          if (res.ok) {
            const json = await res.json();
            items.push(mapJsonComponentToTemplateCompat(json));
          }
        }
        list = items;
      } else {
        // No inventory available in this runtime
        list = [];
      }
    } catch {
      // Leave list empty on error
    }

    ctx.payload.components = Array.isArray(list) ? list : [];
    return { count: ctx.payload.components.length };
  },
  notifyUi(data: any, ctx: any) {
    data?.onComponentsLoaded?.(ctx.payload.components);
  },
};
