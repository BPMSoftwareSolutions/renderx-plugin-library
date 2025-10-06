/**
 * System prompt templates for AI component generation
 * Contains prompts optimized for RenderX component schema
 */

import { SystemPromptTemplate, PromptContext } from '../services/openai.types';

/**
 * Main system prompt for component generation
 */
export const COMPONENT_GENERATION_PROMPT = `You are a component generator for the RenderX platform.
Generate custom UI components in JSON format following this exact schema:

{
  "metadata": {
    "type": "string",         // kebab-case (e.g., "custom-button")
    "name": "string",         // Display name
    "category": "custom",     // Always "custom" for AI-generated components
    "description": "string",
    "version": "1.0.0",
    "author": "AI Generated",
    "tags": ["string"]
  },
  "ui": {
    "template": "string",    // Handlebars template
    "styles": {
      "css": "string",
      "variables": {},
      "library": { "css": "string", "variables": {} }
    },
    "icon": { "mode": "emoji", "value": "string", "position": "start" },
    "tools": {
      "drag": { "enabled": true },
      "resize": {
        "enabled": true,
        "handles": ["nw", "n", "ne", "e", "se", "s", "sw", "w"],
        "constraints": { "min": { "w": 40, "h": 24 } }
      }
    }
  },
  "integration": {
    "properties": {
      "schema": {},           // Property definitions with type, default, description
      "defaultValues": {}     // Default values for properties
    },
    "canvasIntegration": {
      "resizable": true,
      "draggable": true,
      "selectable": true,
      "minWidth": 40,
      "minHeight": 24,
      "defaultWidth": 120,
      "defaultHeight": 40,
      "snapToGrid": true,
      "allowChildElements": false
    },
    "events": {}              // Event definitions (optional)
  },
  "interactions": {
    "canvas.component.create": {
      "pluginId": "CanvasComponentPlugin",
      "sequenceId": "canvas-component-create-symphony"
    },
    "canvas.component.select": {
      "pluginId": "CanvasComponentSelectionPlugin",
      "sequenceId": "canvas-component-select-symphony"
    },
    "canvas.component.drag.move": {
      "pluginId": "CanvasComponentDragPlugin",
      "sequenceId": "canvas-component-drag-symphony"
    },
    "canvas.component.resize.start": {
      "pluginId": "CanvasComponentResizeStartPlugin",
      "sequenceId": "canvas-component-resize-start-symphony"
    },
    "canvas.component.resize.move": {
      "pluginId": "CanvasComponentResizeMovePlugin",
      "sequenceId": "canvas-component-resize-move-symphony"
    },
    "canvas.component.resize.end": {
      "pluginId": "CanvasComponentResizeEndPlugin",
      "sequenceId": "canvas-component-resize-end-symphony"
    }
  }
}

CRITICAL RULES:
1. Always return valid JSON wrapped in \`\`\`json code blocks
2. Use Handlebars syntax: {{variable}}, {{#if condition}}, {{#each items}}
3. Include responsive CSS with CSS variables for customization
4. Add library preview styles in the library object
5. Choose appropriate emoji icons that represent the component
6. Keep templates semantic and accessible (use proper HTML elements)
7. Make components reusable and configurable with variables
8. Include hover effects and smooth transitions where appropriate
9. Use modern CSS features (flexbox, grid, custom properties)
10. Ensure components work well in both light and dark themes
11. ALWAYS include the integration section with properties and canvasIntegration
12. ALWAYS include the interactions section with standard canvas interactions
13. Define properties in integration.properties.schema with type, default, and description
14. Set appropriate canvas integration settings (resizable, draggable, dimensions)

CRITICAL: UNDERSTAND THE DIFFERENCE BETWEEN CSS VARIABLES AND TEMPLATE VARIABLES!

TEMPLATE VARIABLES (for content):
- These go in the Handlebars template: {{text}}, {{variant}}, {{disabled}}
- These are defined in integration.properties.schema
- They represent CONTENT and CONFIGURATION values
- Example: "text": "Click me" is the button's text content

CSS VARIABLES (for styling):
- These go in styles.variables: {"bg-color": "#007bff", "text-color": "#ffffff"}
- These are referenced in CSS: var(--bg-color), var(--text-color)
- They represent VISUAL STYLING properties (colors, sizes, spacing)
- Example: "bg-color": "#007bff" is the background color

NEVER put content values (like "text", "variant", "disabled") in styles.variables!
ONLY put CSS custom properties (like "bg-color", "text-color", "padding") in styles.variables!

TEMPLATE PATTERNS:
- Buttons: <button class="{{classes}}" {{#if disabled}}disabled{{/if}}>{{text}}</button>
- Cards: <div class="card {{variant}}"><h3>{{title}}</h3><p>{{content}}</p></div>
- Inputs: <input type="{{type}}" placeholder="{{placeholder}}" value="{{value}}" />
- Lists: <ul class="{{listClass}}">{{#each items}}<li>{{this}}</li>{{/each}}</ul>

CSS BEST PRACTICES:
- Define CSS custom properties in styles.variables: {"bg-color": "#007bff", "text-color": "#ffffff"}
- Reference them in CSS: background-color: var(--bg-color); color: var(--text-color);
- Include responsive breakpoints: @media (max-width: 768px)
- Add smooth transitions: transition: all 0.2s ease
- Use semantic color names: --success-color, --warning-color, --hover-bg
- Include focus states for accessibility: :focus-visible
- Add hover effects: :hover { transform: translateY(-2px); }
- LIBRARY CSS: Use .rx-lib prefix for library panel styles: .rx-lib .custom-btn { ... }

EXAMPLE COMPONENT TYPES:
- Buttons (primary, secondary, outline, icon)
- Cards (basic, with image, pricing, profile)
- Forms (input, textarea, select, checkbox)
- Navigation (breadcrumb, tabs, pagination)
- Feedback (alert, toast, badge, progress)
- Layout (container, grid, sidebar, header)
- Content (testimonial, feature, pricing table)

Always provide a brief explanation of the component and its features after the JSON.`;

/**
 * Refinement prompt for iterative improvements
 */
export const REFINEMENT_PROMPT = `You are refining an existing RenderX component based on user feedback.

CONTEXT: The user has requested changes to a previously generated component.

INSTRUCTIONS:
1. Analyze the user's feedback carefully
2. Maintain the same component structure and schema
3. Apply the requested changes while preserving existing functionality
4. Improve the component based on the feedback
5. Explain what changes were made and why

Remember to:
- Keep the same metadata.type to avoid conflicts
- Maintain backward compatibility where possible
- Improve accessibility and usability
- Add requested features or styling changes
- Provide clear explanation of modifications

Return the updated component in the same JSON format.`;

/**
 * Example components for context
 */
export const EXAMPLE_COMPONENTS = [
  {
    metadata: {
      type: "custom-button",
      name: "Custom Button",
      category: "custom",
      description: "A customizable button with multiple variants",
      version: "1.0.0",
      author: "AI Generated",
      tags: ["button", "interactive", "form"]
    },
    ui: {
      template: `<button class="custom-btn {{variant}} {{size}}" {{#if disabled}}disabled{{/if}}>
  {{#if icon}}<span class="btn-icon">{{icon}}</span>{{/if}}
  <span class="btn-text">{{text}}</span>
</button>`,
      styles: {
        css: `.custom-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--btn-gap, 8px);
  padding: var(--btn-padding, 12px 24px);
  border: none;
  border-radius: var(--btn-radius, 8px);
  font-size: var(--btn-font-size, 14px);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  background-color: var(--btn-bg, #3b82f6);
  color: var(--btn-color, #ffffff);
}

.custom-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background-color: var(--btn-hover-bg, #2563eb);
}

.custom-btn.primary {
  --btn-bg: #3b82f6;
  --btn-hover-bg: #2563eb;
}

.custom-btn.secondary {
  --btn-bg: #6b7280;
  --btn-hover-bg: #4b5563;
}

.custom-btn.outline {
  background: transparent;
  border: 2px solid var(--btn-bg, #3b82f6);
  color: var(--btn-bg, #3b82f6);
}

.custom-btn.small {
  --btn-padding: 8px 16px;
  --btn-font-size: 12px;
}

.custom-btn.large {
  --btn-padding: 16px 32px;
  --btn-font-size: 18px;
}

.custom-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}`,
        variables: {
          "btn-bg": "#3b82f6",
          "btn-color": "#ffffff",
          "btn-hover-bg": "#2563eb",
          "btn-padding": "12px 24px",
          "btn-radius": "8px",
          "btn-gap": "8px",
          "btn-font-size": "14px"
        },
        library: {
          css: `.rx-lib .custom-btn { 
  display: inline-flex; 
  align-items: center; 
  gap: var(--btn-gap, 8px); 
  padding: var(--btn-padding, 8px 16px); 
  font-size: var(--btn-font-size, 12px); 
  border-radius: var(--btn-radius, 8px);
  background: var(--btn-bg, linear-gradient(135deg, #4f46e5, #3b82f6));
  color: var(--btn-color, #ffffff);
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}

.rx-lib .custom-btn:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}`,
          variables: {
            "btn-bg": "linear-gradient(135deg, #4f46e5, #3b82f6)",
            "btn-color": "#ffffff",
            "btn-padding": "8px 16px",
            "btn-font-size": "12px",
            "btn-radius": "8px",
            "btn-gap": "8px"
          }
        }
      },
      icon: { mode: "emoji", value: "🔘", position: "start" },
      tools: {
        drag: { enabled: true },
        resize: {
          enabled: true,
          handles: ["nw", "n", "ne", "e", "se", "s", "sw", "w"],
          constraints: { min: { w: 40, h: 24 } }
        }
      }
    },
    integration: {
      properties: {
        schema: {
          text: {
            type: "string",
            default: "Click me",
            description: "Button text content",
            required: true
          },
          variant: {
            type: "string",
            default: "primary",
            description: "Button style variant",
            enum: ["primary", "secondary", "outline"]
          },
          size: {
            type: "string",
            default: "medium",
            description: "Button size",
            enum: ["small", "medium", "large"]
          },
          disabled: {
            type: "boolean",
            default: false,
            description: "Whether the button is disabled"
          }
        },
        defaultValues: {
          text: "Click me",
          variant: "primary",
          size: "medium",
          disabled: false
        }
      },
      canvasIntegration: {
        resizable: true,
        draggable: true,
        selectable: true,
        minWidth: 80,
        minHeight: 30,
        maxWidth: 400,
        maxHeight: 100,
        defaultWidth: 120,
        defaultHeight: 40,
        snapToGrid: true,
        allowChildElements: false
      },
      events: {
        click: {
          description: "Triggered when the button is clicked",
          parameters: ["event", "elementData"]
        }
      }
    },
    interactions: {
      "canvas.component.create": {
        pluginId: "CanvasComponentPlugin",
        sequenceId: "canvas-component-create-symphony"
      },
      "canvas.component.select": {
        pluginId: "CanvasComponentSelectionPlugin",
        sequenceId: "canvas-component-select-symphony"
      },
      "canvas.component.drag.move": {
        pluginId: "CanvasComponentDragPlugin",
        sequenceId: "canvas-component-drag-symphony"
      },
      "canvas.component.resize.start": {
        pluginId: "CanvasComponentResizeStartPlugin",
        sequenceId: "canvas-component-resize-start-symphony"
      },
      "canvas.component.resize.move": {
        pluginId: "CanvasComponentResizeMovePlugin",
        sequenceId: "canvas-component-resize-move-symphony"
      },
      "canvas.component.resize.end": {
        pluginId: "CanvasComponentResizeEndPlugin",
        sequenceId: "canvas-component-resize-end-symphony"
      }
    }
  }
];

/**
 * Component validation guidelines
 */
export const VALIDATION_GUIDELINES = [
  "Component must have valid metadata with type and name",
  "Template must use valid Handlebars syntax",
  "CSS must be valid and not contain external imports",
  "Variables should have sensible default values",
  "Icon should be a single emoji character",
  "Component should be responsive and accessible",
  "No JavaScript or external dependencies allowed"
];

/**
 * Build system prompt with context
 */
export function buildSystemPrompt(context?: PromptContext): string {
  let prompt = COMPONENT_GENERATION_PROMPT;
  
  if (context?.examples?.length) {
    prompt += "\n\nEXAMPLE COMPONENTS:\n";
    context.examples.forEach((example, index) => {
      prompt += `\nExample ${index + 1}:\n\`\`\`json\n${JSON.stringify(example, null, 2)}\n\`\`\`\n`;
    });
  }
  
  if (context?.guidelines?.length) {
    prompt += "\n\nADDITIONAL GUIDELINES:\n";
    context.guidelines.forEach((guideline, index) => {
      prompt += `${index + 1}. ${guideline}\n`;
    });
  }
  
  if (context?.constraints?.length) {
    prompt += "\n\nCONSTRAINTS:\n";
    context.constraints.forEach((constraint, index) => {
      prompt += `${index + 1}. ${constraint}\n`;
    });
  }
  
  return prompt;
}

/**
 * Available prompt templates
 */
export const PROMPT_TEMPLATES: SystemPromptTemplate[] = [
  {
    id: 'default',
    name: 'Default Component Generation',
    description: 'Standard prompt for generating RenderX components',
    template: COMPONENT_GENERATION_PROMPT
  },
  {
    id: 'refinement',
    name: 'Component Refinement',
    description: 'Prompt for refining existing components based on feedback',
    template: REFINEMENT_PROMPT
  }
];

/**
 * Get prompt template by ID
 */
export function getPromptTemplate(id: string): SystemPromptTemplate | undefined {
  return PROMPT_TEMPLATES.find(template => template.id === id);
}

/**
 * Common component categories and their characteristics
 */
export const COMPONENT_CATEGORIES = {
  buttons: {
    description: "Interactive elements for user actions",
    examples: ["primary button", "secondary button", "icon button", "floating action button"],
    commonProps: ["text", "variant", "size", "disabled", "icon"]
  },
  forms: {
    description: "Input elements for data collection",
    examples: ["text input", "textarea", "select dropdown", "checkbox", "radio button"],
    commonProps: ["value", "placeholder", "required", "disabled", "label"]
  },
  layout: {
    description: "Structural components for page organization",
    examples: ["container", "grid", "card", "sidebar", "header", "footer"],
    commonProps: ["width", "padding", "margin", "background", "border"]
  },
  navigation: {
    description: "Components for site navigation",
    examples: ["breadcrumb", "tabs", "pagination", "menu", "navbar"],
    commonProps: ["items", "active", "variant", "orientation"]
  },
  feedback: {
    description: "Components for user feedback and status",
    examples: ["alert", "toast", "badge", "progress bar", "loading spinner"],
    commonProps: ["type", "message", "variant", "progress", "visible"]
  }
};
