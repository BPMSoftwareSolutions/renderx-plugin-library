# Example Custom Components

This directory contains example custom component JSON files that can be used to test the Custom Components feature.

## Usage

1. Open the RenderX Component Library panel
2. Locate the "Custom Components" category (should be the first category)
3. Drag and drop any of these JSON files into the upload zone, or click to browse
4. The component will be loaded and appear in the Custom Components grid
5. You can then drag the component from the library onto your canvas

## Example Components

### 1. Custom Alert (`custom-alert.json`)
A custom alert component with icon and styling.

**Features:**
- Warning icon (⚠️)
- Yellow/amber color scheme
- Rounded corners and shadow
- Gradient background in library preview

**Use Cases:**
- Warning messages
- Important notifications
- Status alerts

### 2. Badge (`custom-badge.json`)
A badge component for displaying status or counts.

**Features:**
- Label icon (🏷️)
- Compact size
- Uppercase text
- Purple gradient in library preview

**Use Cases:**
- Status indicators (New, Hot, Sale)
- Notification counts
- Tags and labels

### 3. Card (`custom-card.json`)
A card container component with shadow and hover effects.

**Features:**
- Card icon (🃏)
- Container role (can hold child components)
- Hover lift effect
- Purple gradient in library preview
- Resize handles on all sides

**Use Cases:**
- Content containers
- Product cards
- Feature boxes
- Dashboard widgets

## Component JSON Structure

Each custom component JSON file follows the comprehensive RenderX JSON component format:

```json
{
  "metadata": {
    "type": "unique-component-type",    // Required: Unique identifier (kebab-case)
    "name": "Display Name",             // Required: Name shown in library
    "version": "1.0.0",                 // Optional: Semantic version
    "author": "Author Name",            // Optional: Component author
    "description": "Component description", // Optional: Detailed description
    "category": "custom",               // Optional: Defaults to "custom"
    "tags": ["tag1", "tag2"]           // Optional: Searchable tags
  },
  "ui": {
    "template": "<div class=\"rx-custom\">{{content}}</div>", // Handlebars template
    "styles": {
      "css": ".rx-custom { ... }",      // CSS for canvas rendering
      "variables": {                    // CSS variables for canvas
        "bg-color": "#fff",
        "text-color": "#000"
      },
      "library": {
        "css": ".rx-lib .rx-custom { ... }", // CSS for library preview
        "variables": {                  // CSS variables for library preview
          "bg": "linear-gradient(...)"
        }
      }
    },
    "icon": {
      "mode": "emoji",                  // Icon mode: emoji, svg, text
      "value": "🎨",                    // Icon value
      "position": "start"               // Icon position: start, end
    },
    "tools": {
      "drag": { "enabled": true },
      "resize": {
        "enabled": true,
        "handles": ["nw", "n", "ne", "e", "se", "s", "sw", "w"],
        "constraints": { "min": { "w": 100, "h": 50 } }
      }
    }
  },
  "integration": {
    "properties": {
      "schema": {                       // Property definitions
        "content": {
          "type": "string",
          "default": "Default text",
          "description": "Content text",
          "required": true
        }
      },
      "defaultValues": {                // Default property values
        "content": "Default text"
      }
    },
    "canvasIntegration": {              // Canvas behavior
      "resizable": true,
      "draggable": true,
      "selectable": true,
      "minWidth": 100,
      "minHeight": 50,
      "defaultWidth": 200,
      "defaultHeight": 100,
      "snapToGrid": true,
      "allowChildElements": false
    },
    "events": {                         // Component events
      "click": {
        "description": "Triggered on click",
        "parameters": ["event", "elementData"]
      }
    }
  },
  "interactions": {                     // Plugin interactions
    "canvas.component.create": {
      "pluginId": "CanvasComponentPlugin",
      "sequenceId": "canvas-component-create-symphony"
    }
  }
}
```

## Required Fields

Minimum required fields for a valid custom component:

```json
{
  "metadata": {
    "type": "my-component",
    "name": "My Component"
  },
  "ui": {
    "template": "<div>{{content}}</div>"
  }
}
```

**Note:** The `ui.template` field can be either:
- **String** (Handlebars template): `"<div>{{content}}</div>"`
- **Object** (JSON structure): `{ "tag": "div", "text": "content" }`

The Handlebars format is recommended for real components as it supports dynamic properties and is more flexible.

## Validation Rules

The custom component uploader validates:

1. **Valid JSON**: File must be valid JSON format
2. **metadata.type**: Must be present, unique, and in kebab-case format (e.g., `custom-button`)
3. **metadata.name**: Must be present and non-empty
4. **ui.template**: Must be present as either a string (Handlebars) or object (JSON structure)
5. **ui object**: Must contain at least one of: `template`, `styles`, or `html`
6. **File Size**: Maximum 1MB per component
7. **Total Storage**: Maximum 10MB total for all custom components
8. **File Extension**: Must be `.json`

## Tips for Creating Custom Components

### 1. Use Unique Type Names
Choose a unique `type` that won't conflict with other components:
- ✅ Good: `custom-alert`, `acme-button`, `my-special-card`
- ❌ Bad: `button`, `div`, `component`

### 2. Provide Good Metadata
- Use descriptive names and descriptions
- Choose appropriate icons (emojis work great)
- Set the category to "custom" for consistency

### 3. Include Both Canvas and Library Styles
- `ui.styles.css` / `ui.styles.variables`: Styles for the component on the canvas
- `ui.styles.library.css` / `ui.styles.library.variables`: Styles for the library preview
- Library previews should be visually distinct and attractive
- Use the `.rx-lib` prefix for library-specific CSS

### 4. Make Components Resizable
Include resize configuration in the `ui.tools` section:
```json
"ui": {
  "tools": {
    "resize": {
      "enabled": true,
      "handles": ["nw", "n", "ne", "e", "se", "s", "sw", "w"],
      "constraints": { "min": { "w": 100, "h": 50 } }
    }
  }
}
```

### 5. Container Components
If your component can contain other components, set in `integration.canvasIntegration`:
```json
"integration": {
  "canvasIntegration": {
    "allowChildElements": true
  }
}
```

### 6. Test Your Component
Before sharing, test that:
- The component loads without errors
- The preview looks good in the library
- The component renders correctly on the canvas
- The component can be dragged and dropped
- Resize handles work (if applicable)
- CSS doesn't conflict with other components

## Troubleshooting

### Component Won't Upload
- Verify JSON is valid (use JSONLint.com)
- Check that required fields are present
- Ensure file is under 1MB
- Check browser console for specific error messages

### Component Doesn't Render
- Verify `ui.template` is valid (either Handlebars string or JSON object)
- Check that CSS selectors match class names in the template
- Ensure CSS variables are properly prefixed with `--`
- Check browser console for template parsing errors

### Styling Issues
- CSS in `ui.styles.css` field applies to canvas rendering
- CSS in `ui.styles.library.css` field applies to library preview only
- Use CSS variables for customizable properties
- Avoid global selectors that might affect other components
- Ensure library CSS uses `.rx-lib` prefix for proper scoping

### Storage Quota Exceeded
- Remove unused custom components
- Reduce component size by minifying CSS
- Clear browser localStorage if needed

## Contributing

To add more example components to this collection:

1. Create a new `.json` file in this directory
2. Follow the component JSON structure above
3. Test the component thoroughly
4. Add documentation to this README
5. Submit a pull request

## Component Format Comparison

### Handlebars Template Format (Recommended)
Used in: `custom-alert.json`, `custom-badge.json`, `custom-card.json`, and all `real-json-components/`

**Advantages:**
- ✅ Supports dynamic properties with `{{variable}}` syntax
- ✅ Conditional rendering with `{{#if}}` blocks
- ✅ More flexible and powerful
- ✅ Matches real RenderX component format
- ✅ Better for complex components

**Example:**
```json
{
  "ui": {
    "template": "<button class=\"btn btn--{{variant}}\">{{content}}</button>",
    "styles": {
      "css": ".btn { ... }",
      "variables": { "color": "#007bff" },
      "library": {
        "css": ".rx-lib .btn { ... }",
        "variables": { "color": "#6366f1" }
      }
    }
  }
}
```

### JSON Object Format (Legacy)
Simpler format for basic components without dynamic properties.

**Advantages:**
- ✅ Simpler structure
- ✅ Good for static components
- ✅ Easier to understand for beginners

**Example:**
```json
{
  "ui": {
    "template": {
      "tag": "button",
      "classes": ["btn"],
      "text": "Click me",
      "css": ".btn { ... }",
      "cssLibrary": ".rx-lib .btn { ... }"
    }
  }
}
```

**Recommendation:** Use the Handlebars format for all new components as it provides more flexibility and matches the real RenderX component structure.

## Resources

- [RenderX Component Documentation](../README.md)
- [Component Library Plugin](../src/ui/LibraryPanel.tsx)
- [Handlebars Template Guide](https://handlebarsjs.com/guide/)
- [JSON Schema Validator](https://www.jsonschemavalidator.net/)
- [CSS Variables Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
