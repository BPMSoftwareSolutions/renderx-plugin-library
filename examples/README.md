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

Each custom component JSON file follows this structure:

```json
{
  "metadata": {
    "type": "unique-component-type",    // Required: Unique identifier
    "name": "Display Name",             // Required: Name shown in library
    "category": "custom",               // Optional: Defaults to "custom"
    "description": "Component description" // Optional: Tooltip text
  },
  "ui": {
    "template": {
      "tag": "div",                     // HTML tag to use
      "classes": ["rx-custom-name"],    // CSS classes
      "attributes": {                   // HTML attributes
        "data-icon": "🎨",              // Icon shown in library
        "data-icon-pos": "start",       // Icon position
        "data-category": "custom",      // Category grouping
        "data-description": "...",      // Description text
        "data-resize-handles": "...",   // Resize behavior
        "data-resize-min-w": "100",     // Min width
        "data-resize-min-h": "50",      // Min height
        "data-role": "container"        // Optional: container role
      },
      "text": "Default content",        // Default text content
      "cssVariables": {                 // CSS variables for canvas
        "bg-color": "#fff",
        "text-color": "#000"
      },
      "css": ".rx-custom-name { ... }", // CSS for canvas rendering
      "cssVariablesLibrary": {          // CSS variables for library preview
        "bg": "linear-gradient(...)"
      },
      "cssLibrary": ".rx-lib .rx-custom-name { ... }" // CSS for library preview
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
    "template": {
      "tag": "div"
    }
  }
}
```

## Validation Rules

The custom component uploader validates:

1. **Valid JSON**: File must be valid JSON format
2. **metadata.type**: Must be present and unique
3. **metadata.name**: Must be present
4. **ui.template**: Must be present with at least a `tag` property
5. **File Size**: Maximum 1MB per component
6. **Total Storage**: Maximum 10MB total for all custom components

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
- `css` / `cssVariables`: Styles for the component on the canvas
- `cssLibrary` / `cssVariablesLibrary`: Styles for the library preview
- Library previews should be visually distinct and attractive

### 4. Make Components Resizable
Include resize attributes if your component supports resizing:
```json
"attributes": {
  "data-resize-handles": "nw,n,ne,e,se,s,sw,w",
  "data-resize-min-w": "100",
  "data-resize-min-h": "50"
}
```

### 5. Container Components
If your component can contain other components, set:
```json
"attributes": {
  "data-role": "container"
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
- Verify `ui.template.tag` is a valid HTML tag
- Check that CSS selectors match class names
- Ensure CSS variables are properly prefixed with `--`

### Styling Issues
- CSS in `css` field applies to canvas rendering
- CSS in `cssLibrary` field applies to library preview only
- Use CSS variables for customizable properties
- Avoid global selectors that might affect other components

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

## Resources

- [RenderX Component Documentation](../README.md)
- [Component Library Plugin](../src/ui/LibraryPanel.tsx)
- [JSON Schema Validator](https://www.jsonschemavalidator.net/)
- [CSS Variables Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
