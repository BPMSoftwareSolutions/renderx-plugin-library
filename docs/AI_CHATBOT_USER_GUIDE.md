# AI Component Generator - User Guide

The AI Component Generator is an intelligent assistant that helps you create custom UI components using natural language descriptions. Simply describe what you want, and the AI will generate a complete, ready-to-use component for your RenderX project.

## 🚀 Getting Started

### Accessing the AI Assistant

1. Look for the **🤖 AI** button in the Component Library panel header
2. If you don't see the button, AI features may not be configured (contact your administrator)
3. Click the button to open the AI chat window

### Basic Usage

1. **Open the Chat**: Click the 🤖 AI button
2. **Describe Your Component**: Type what you want in plain English
3. **Review the Result**: The AI will generate a component with preview
4. **Add to Library**: Click "Add to Library" to save the component

## 💬 Writing Effective Prompts

### Best Practices

- **Be Specific**: Include details about appearance, behavior, and functionality
- **Mention Colors**: Specify color schemes or themes
- **Include Size/Layout**: Describe dimensions, spacing, or layout preferences
- **State Purpose**: Explain what the component will be used for

### Example Prompts

#### Buttons
```
"Create a blue primary button with rounded corners and a hover effect"
"Make a large red delete button with an icon"
"Design a ghost button with just an outline and no background"
```

#### Cards
```
"Create a product card with image, title, description, and price"
"Make a profile card with avatar, name, and social links"
"Design a simple card with a shadow and rounded corners"
```

#### Forms
```
"Create a text input with a floating label"
"Make a search input with a magnifying glass icon"
"Design a textarea for comments with a character counter"
```

#### Navigation
```
"Create a breadcrumb navigation component"
"Make horizontal tabs with underline indicators"
"Design a pagination component with previous/next buttons"
```

#### Feedback
```
"Create a success alert with a green background"
"Make a loading spinner with smooth animation"
"Design a progress bar that shows completion percentage"
```

## 🎨 Customization Tips

### Colors and Themes
- Specify exact colors: "bright blue (#007bff)"
- Use theme references: "primary color", "success green"
- Request dark mode support: "works in both light and dark themes"

### Responsive Design
- Request mobile-friendly components: "responsive on mobile"
- Specify breakpoints: "stack vertically on small screens"
- Ask for flexible layouts: "adapts to container width"

### Accessibility
- Request accessible features: "with proper ARIA labels"
- Ask for keyboard support: "keyboard navigable"
- Specify focus states: "clear focus indicators"

## 🔄 Iterative Refinement

### Making Changes
1. **Continue the Conversation**: Ask for modifications in the same chat
2. **Be Specific**: "Make the button larger" or "Change the color to green"
3. **Try Again**: Use the "🔄 Try Again" button for a fresh approach

### Example Refinement Flow
```
You: "Create a blue button"
AI: [Generates basic blue button]
You: "Make it larger and add a shadow"
AI: [Updates the button with requested changes]
You: "Perfect! Add to library"
```

## 📋 Component Actions

### Available Actions
- **➕ Add to Library**: Saves the component to your custom components
- **📄 View JSON**: Shows the complete component code
- **📋 Copy JSON**: Copies the component code to clipboard
- **🔄 Try Again**: Generates a new version of the component

### Managing Generated Components
- Components are saved in the "Custom" category
- You can delete components using the remove button (🗑️)
- Components persist across browser sessions

## 💡 Tips for Success

### Do's
✅ **Be descriptive**: "Create a card with a blue header, white body, and subtle shadow"  
✅ **Specify interactions**: "Button should have a hover effect and loading state"  
✅ **Mention use cases**: "For displaying user profiles in a grid layout"  
✅ **Ask for variations**: "Create three button sizes: small, medium, large"  

### Don'ts
❌ **Don't be too vague**: "Make a component" (too generic)  
❌ **Don't request complex logic**: AI generates UI, not business logic  
❌ **Don't ask for external dependencies**: Components use only standard web technologies  
❌ **Don't expect pixel-perfect designs**: Focus on structure and styling  

## 🔧 Troubleshooting

### Common Issues

#### "AI features require configuration"
- **Cause**: OpenAI API key not configured
- **Solution**: Contact your administrator to enable AI features

#### Component not generating
- **Cause**: Network issues or API limits
- **Solution**: Try again in a few moments

#### Generated component looks wrong
- **Cause**: Unclear prompt or AI misunderstanding
- **Solution**: Provide more specific details and try again

#### Can't add component to library
- **Cause**: Storage quota exceeded or duplicate component type
- **Solution**: Remove old components or use a different component type name

### Getting Help
- Check the configuration status in the chat window
- Review error messages for specific guidance
- Contact your administrator for API key or configuration issues

## 📚 Component Examples

### Button Variations
- Primary, secondary, outline, ghost buttons
- Different sizes (small, medium, large)
- With icons, loading states, disabled states
- Various color schemes and themes

### Layout Components
- Containers with different max-widths
- Grid systems with responsive columns
- Flexbox layouts for centering content
- Card layouts with headers and footers

### Form Elements
- Text inputs with validation styles
- Dropdowns with custom styling
- Checkboxes and radio buttons
- File upload areas with drag-and-drop

### Interactive Elements
- Tabs with smooth transitions
- Accordions with expand/collapse
- Modals and overlays
- Tooltips and popovers

## 🎯 Advanced Usage

### Multi-turn Conversations
Keep the chat open to refine components through multiple exchanges:

```
You: "Create a pricing card"
AI: [Generates basic pricing card]
You: "Add a 'Most Popular' badge"
AI: [Adds badge to the card]
You: "Make the badge red and position it in the top-right corner"
AI: [Refines the badge styling and position]
```

### Component Families
Create related components in one session:

```
You: "Create a set of alert components for success, warning, and error states"
AI: [Generates multiple alert variants]
```

### Template Variations
Ask for multiple versions:

```
You: "Create three button styles: filled, outlined, and text-only"
AI: [Generates three different button components]
```

## 📖 Understanding Generated Components

### Component Structure
Each generated component includes:
- **Metadata**: Name, type, description, tags
- **Template**: HTML structure with Handlebars variables
- **Styles**: CSS with custom properties for theming
- **Variables**: Default values for customization
- **Icon**: Emoji representation for the library

### Customization Variables
Generated components include variables you can modify:
- Text content (labels, placeholders)
- Colors (backgrounds, borders, text)
- Sizes (padding, margins, dimensions)
- States (disabled, active, hover)

### CSS Features
Components use modern CSS features:
- Custom properties (CSS variables) for theming
- Flexbox and Grid for layouts
- Transitions and animations
- Responsive design patterns
- Accessibility considerations

---

**Need more help?** Contact your administrator or check the technical documentation for advanced configuration options.
