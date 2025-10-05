import React from "react";
import {
  useConductor,
  resolveInteraction,
  EventRouter,
} from "@renderx-plugins/host-sdk";
import {
  groupComponentsByCategory,
  getCategoryDisplayName,
} from "../utils/library.utils.js";
import { LibraryPreview } from "./LibraryPreview";
import { CustomComponentUpload } from "./CustomComponentUpload";
import { CustomComponentList } from "./CustomComponentList";
import { ChatWindow } from "./ChatWindow";
import { loadCustomComponents, saveCustomComponent } from "../utils/storage.utils";
import { OpenAIService } from "../services/openai.service";
import { ComponentJSON } from "../services/openai.types";
import "./LibraryPanel.css";
import { isFlagEnabled } from "@renderx-plugins/host-sdk";

// Error boundary for custom components
class CustomComponentErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Custom component error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="custom-component-error">
          <span className="error-icon">⚠️</span>
          <div className="error-text">
            <div className="error-title">Custom Component Error</div>
            <div className="error-message">
              There was an error loading custom components. Please try refreshing the page.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Exported for unit tests: registers JSON component CSS via Control Panel sequences
export async function registerCssForComponents(items: any[], _conductor: any) {
  try {
    const seen = new Set<string>();
    for (const item of Array.isArray(items) ? items : []) {
      const tpl = (item as any)?.template ?? item;
      let css: string | undefined = tpl?.css;
      if (!css && (item as any)?.ui?.styles?.css) css = (item as any).ui.styles.css;
      if (typeof css !== "string" || !css.trim()) continue;
      const classes: string[] = Array.isArray(tpl?.classes) ? tpl.classes : [];
      const base = classes.find((c) => c.startsWith("rx-") && c !== "rx-comp");
      const metaType = (item as any)?.metadata?.replaces || (item as any)?.metadata?.type;
      const name = base || (metaType ? `rx-${metaType}` : undefined);
      if (!name || seen.has(name)) continue;
      seen.add(name);
    }
  } catch {}
}

export function LibraryPanel() {
  const conductor = useConductor();
  const [items, setItems] = React.useState<any[]>([]);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [showAIChat, setShowAIChat] = React.useState(false);
  const safeItems = Array.isArray(items) ? items : [];
  const customComponents = loadCustomComponents();

  // Check if AI features are available
  const aiEnabled = OpenAIService.isConfigured();

  const loadComponents = React.useCallback(async () => {
    try {
      await EventRouter.publish(
        "library.load.requested",
        {
          onComponentsLoaded: (list: any[]) => setItems(list),
        },
        conductor
      );
    } catch {}
    // Always attempt a direct routing fallback as well (ensures behavior when host router is missing)
    try {
      const r = resolveInteraction("library.load");
      if (!r?.pluginId || !r?.sequenceId) {
        throw new Error("Unknown interaction 'library.load'");
      }
      await conductor?.play?.(r.pluginId, r.sequenceId, {
        onComponentsLoaded: (list: any[]) => setItems(list),
      });
    } catch (err) {
      // Gate console usage by a feature flag per guardrails
      if (isFlagEnabled("ui.layout-manifest")) {
        console.warn(
          "LibraryPanel: fallback routing unavailable (no host router and unknown interaction 'library.load').",
          err
        );
      }
    }
  }, [conductor]);

  React.useEffect(() => {
    loadComponents();
  }, [loadComponents, refreshKey]);

  // After components are loaded, register their CSS via Control Panel sequences
  React.useEffect(() => {
    if (!conductor || !safeItems?.length) return;
    registerCssForComponents(safeItems, conductor);
  }, [safeItems, conductor]);

  const handleCustomComponentAdded = () => {
    // Refresh the component list to include the new custom component
    setRefreshKey(prev => prev + 1);
  };

  const handleCustomComponentRemoved = () => {
    // Refresh the component list to remove the deleted custom component
    setRefreshKey(prev => prev + 1);
  };

  const handleAIComponentGenerated = async (component: ComponentJSON) => {
    try {
      // Save the AI-generated component to custom components
      const result = await saveCustomComponent(component);

      if (result.success) {
        // Refresh the component list to include the new AI-generated component
        setRefreshKey(prev => prev + 1);

        // Close the AI chat window
        setShowAIChat(false);

        console.log('AI-generated component added to library:', component.metadata.name);
      } else {
        console.error('Failed to save AI-generated component:', result.error);
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error('Failed to save AI-generated component:', error);
      // TODO: Show error message to user
    }
  };

  const groupedComponents = groupComponentsByCategory(safeItems);

  // Ensure custom category always exists (even if empty) so users can upload
  if (!groupedComponents.custom) {
    groupedComponents.custom = [];
  }

  return (
    <div className="library-sidebar">
      <div className="library-sidebar-header">
        <div className="library-header-content">
          <h2 className="library-sidebar-title">🧩 Component Library</h2>
          <p className="library-sidebar-subtitle">
            Drag components to the canvas
          </p>
        </div>

        <div className="library-header-actions">
          {/* AI Chat Toggle - Only show if configured */}
          {aiEnabled && (
            <button
              className="ai-chat-toggle"
              onClick={() => setShowAIChat(!showAIChat)}
              title="AI Component Generator"
              aria-label="Open AI Component Generator"
            >
              🤖 AI
            </button>
          )}

          {/* Info notice when AI not available */}
          {!aiEnabled && (
            <div
              className="ai-unavailable-hint"
              title="AI features require configuration by administrator"
            >
              <span className="hint-icon">💡</span>
            </div>
          )}
        </div>
      </div>

      <div className="library-component-library rx-lib">
        {Object.entries(groupedComponents).map(([category, components]) => (
          <div key={category} className="library-component-category">
            <div className="library-category-title">
              {getCategoryDisplayName(category)}
            </div>

            {/* Add upload zone and component list for custom category */}
            {category === 'custom' && (
              <CustomComponentErrorBoundary>
                <CustomComponentUpload
                  onComponentAdded={handleCustomComponentAdded}
                />
                {customComponents.length > 0 && (
                  <CustomComponentList
                    components={customComponents}
                    onComponentRemoved={handleCustomComponentRemoved}
                  />
                )}
              </CustomComponentErrorBoundary>
            )}

            <div className="library-component-grid">
              {components.map((component) => (
                <LibraryPreview
                  key={component.id}
                  component={component}
                  conductor={conductor}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* AI Chat Window */}
      {showAIChat && aiEnabled && (
        <ChatWindow
          isOpen={showAIChat}
          onClose={() => setShowAIChat(false)}
          onComponentGenerated={handleAIComponentGenerated}
        />
      )}
    </div>
  );
}

