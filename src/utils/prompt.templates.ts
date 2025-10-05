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
    "category": "custom",     // Always "custom"
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
    "icon": { "mode": "emoji", "value": "string" }
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

TEMPLATE PATTERNS:
- Buttons: <button class="{{classes}}" {{#if disabled}}disabled{{/if}}>{{text}}</button>
- Cards: <div class="card {{variant}}"><h3>{{title}}</h3><p>{{content}}</p></div>
- Inputs: <input type="{{type}}" placeholder="{{placeholder}}" value="{{value}}" />
- Lists: <ul class="{{listClass}}">{{#each items}}<li>{{this}}</li>{{/each}}</ul>

CSS BEST PRACTICES:
- Use CSS custom properties for theming: --primary-color, --text-color, etc.
- Include responsive breakpoints: @media (max-width: 768px)
- Add smooth transitions: transition: all 0.2s ease
- Use semantic color names: --success-color, --warning-color
- Include focus states for accessibility: :focus-visible
- Add hover effects: :hover { transform: translateY(-2px); }

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
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.custom-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.custom-btn.primary {
  background: var(--primary-color, #3b82f6);
  color: white;
}

.custom-btn.secondary {
  background: var(--secondary-color, #6b7280);
  color: white;
}

.custom-btn.outline {
  background: transparent;
  border: 2px solid var(--primary-color, #3b82f6);
  color: var(--primary-color, #3b82f6);
}

.custom-btn.small {
  padding: 8px 16px;
  font-size: 14px;
}

.custom-btn.large {
  padding: 16px 32px;
  font-size: 18px;
}

.custom-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}`,
        variables: {
          text: "Click me",
          variant: "primary",
          size: "medium",
          disabled: false,
          icon: ""
        },
        library: {
          css: `.custom-btn { padding: 8px 16px; font-size: 12px; }`,
          variables: {
            text: "Button",
            variant: "primary",
            size: "small"
          }
        }
      },
      icon: { mode: "emoji", value: "🔘" }
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
