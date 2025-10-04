# Feature Request: AI-Powered Component Generator with Chat Interface

## Summary
Add an AI-powered chat interface to the Component Library panel that allows users to describe components in natural language and have them automatically generated using OpenAI's API. The generated components will be validated and can be directly added to the custom components library.

## Background
The library currently supports user-uploaded custom components via drag-and-drop JSON files. This feature would extend that capability by allowing users to generate component JSON through conversational AI, making component creation accessible to non-technical users and accelerating development for technical users.

## Motivation
- **Lower barrier to entry**: Users without JSON/coding knowledge can create components through natural conversation
- **Accelerate development**: Technical users can quickly prototype components without writing boilerplate
- **Learning tool**: Generated components serve as examples for users to learn the component schema
- **Consistency**: AI-generated components follow the established schema and best practices

## Requirements

### 1. UI Components

#### 1.1 Chat Window Component (`src/ui/ChatWindow.tsx`)
A collapsible chat interface integrated into the Library Panel:

**Features:**
- **Toggle Button**: 
  - Position: Top-right corner of Library Panel header
  - Icon: 🤖 or "AI" badge
  - Shows/hides chat window
  - Badge indicator when new suggestions available

- **Chat Interface**:
  - Message history display (user messages + AI responses)
  - Text input area with send button
  - "Generating..." loading state during API calls
  - Auto-scroll to latest message
  - Message bubbles with distinct styling (user vs AI)
  - Code blocks for generated JSON (with syntax highlighting)
  - Action buttons on AI messages:
    - "Add to Library" - Validates and saves component
    - "Edit JSON" - Opens editor modal
    - "Try Again" - Regenerates with feedback
    - "Copy JSON" - Copies to clipboard

- **Chat History**:
  - Persist conversation in localStorage
  - Clear history button
  - Session management (group by date/session)

#### 1.2 API Key Configuration (`src/ui/ApiKeySettings.tsx`)
Settings panel for OpenAI API configuration:

**Features:**
- API key input field (password-masked)
- "Save" and "Clear" buttons
- Key validation (test connection)
- Status indicator (connected/disconnected)
- Link to OpenAI API key page
- Model selection dropdown (GPT-4, GPT-3.5-turbo, etc.)
- Token usage display (optional)
- Security warning about key storage

**Storage:**
- Store encrypted API key in localStorage
- Key: `renderx:openai-api-key`
- Include basic obfuscation (Base64 at minimum)

#### 1.3 Component Preview & Edit Modal
Modal for reviewing/editing generated components before saving:

**Features:**
- Side-by-side view: JSON editor + live preview
- JSON validation with error highlighting
- Preview rendering using LibraryPreview component
- "Save to Library" button
- "Regenerate" button with optional feedback prompt

### 2. OpenAI Integration

#### 2.1 API Service (`src/services/openai.service.ts`)
Handles all OpenAI API interactions:

**Functions:**
```typescript
interface OpenAIConfig {
  apiKey: string;
  model?: string; // default: 'gpt-4-turbo-preview'
  temperature?: number; // default: 0.7
  maxTokens?: number; // default: 2000
}

interface GenerateComponentOptions {
  prompt: string;
  context?: string[]; // Previous messages for context
  examples?: any[]; // Example components to reference
}

interface GenerateComponentResponse {
  success: boolean;
  component?: any; // Generated JSON component
  explanation?: string; // AI explanation of the component
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Main API service
class OpenAIService {
  async generateComponent(
    options: GenerateComponentOptions,
    config: OpenAIConfig
  ): Promise<GenerateComponentResponse>;
  
  async validateApiKey(apiKey: string): Promise<boolean>;
  
  async improveComponent(
    component: any,
    feedback: string,
    config: OpenAIConfig
  ): Promise<GenerateComponentResponse>;
}
```

**API Request Structure:**
- Endpoint: `https://api.openai.com/v1/chat/completions`
- Method: POST
- Headers: `Authorization: Bearer ${apiKey}`
- Body: Chat completion with system prompt + user messages

**System Prompt Design:**
```
You are a component generator for the RenderX platform. Generate custom UI components 
in JSON format following this exact schema:

{
  "metadata": {
    "type": "string",         // kebab-case, unique identifier (e.g., "custom-button")
    "name": "string",         // Display name (e.g., "Custom Button")
    "category": "custom",     // Always "custom"
    "description": "string",  // Brief description
    "version": "1.0.0",      // Semantic version
    "author": "AI Generated",
    "tags": ["string"]       // Relevant tags
  },
  "ui": {
    "template": "string",    // Handlebars template
    "styles": {
      "css": "string",       // Component CSS
      "variables": {},       // CSS custom properties
      "library": {           // Library preview styles
        "css": "string",
        "variables": {}
      }
    },
    "icon": {
      "mode": "emoji",
      "value": "string",
      "position": "start"
    }
  }
}

Rules:
1. Always return valid JSON
2. Use Handlebars syntax for templates: {{variable}}, {{#if}}, {{#each}}
3. Include responsive CSS with CSS variables
4. Add library preview styles for the component picker
5. Choose appropriate emoji icons
6. Keep templates semantic and accessible
7. Provide clear descriptions
```

**Example Component References:**
Include 2-3 example components in the system prompt from `examples/` directory to guide output format.

#### 2.2 Error Handling
- Network errors (offline, timeout)
- Invalid API key
- Rate limiting (429 responses)
- Token limit exceeded
- Invalid JSON responses from AI
- API quota exceeded

**User-Friendly Error Messages:**
- "Unable to connect to OpenAI. Please check your internet connection."
- "Invalid API key. Please check your settings."
- "Rate limit reached. Please wait a moment and try again."
- "AI response couldn't be parsed. Please try again with a simpler request."

### 3. Component Generation Flow

#### 3.1 User Journey
1. **User clicks AI chat button** → Chat window opens
2. **User describes component** (e.g., "Create a card with an image, title, and description")
3. **System sends to OpenAI** with system prompt + user message
4. **AI generates JSON** → Parsed and validated
5. **Component preview displayed** in chat with action buttons
6. **User reviews** → Can edit, regenerate, or add to library
7. **User clicks "Add to Library"** → Component saved and appears in custom category

#### 3.2 Validation Pipeline
```
User Message → OpenAI API → Raw Response
    ↓
Parse JSON → Validate Schema → Check Duplicates
    ↓
Success: Show Preview | Failure: Show Error + Retry Option
```

Use existing validation from `validation.utils.ts` for consistency.

#### 3.3 Conversation Context
Maintain conversation history for better results:
- Keep last 5-10 messages in context
- Allow iterative refinement ("Make the button blue", "Add a shadow")
- Reference previously generated components in session

### 4. Storage & State Management

#### 4.1 Chat State (`src/utils/chat.utils.ts`)
```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  component?: any; // For assistant messages with generated components
  metadata?: {
    tokens?: number;
    model?: string;
  };
}

interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

// Storage functions
function saveChatHistory(session: ChatSession): void;
function loadChatHistory(): ChatSession | null;
function clearChatHistory(): void;
function addMessage(message: ChatMessage): void;
```

Storage key: `renderx:ai-chat-history`

#### 4.2 API Key Storage
- Key: `renderx:openai-config`
- Value: `{ apiKey: string, model: string, ...config }`
- Encrypt/obfuscate before storage
- Clear on logout or manual clear

### 5. Security Considerations

#### 5.1 API Key Protection
⚠️ **Critical Security Concerns:**
- API keys stored in localStorage are **NOT SECURE**
- Any JavaScript on the page can read localStorage
- XSS vulnerabilities could expose keys
- Not recommended for production without backend proxy

**Recommended Approaches:**

**Option A: Backend Proxy (Most Secure)**
- User's API key sent to backend once
- Backend stores key securely (encrypted DB, env vars)
- Frontend makes requests to backend
- Backend proxies to OpenAI API
- Requires server infrastructure

**Option B: Session Storage (Better)**
- Use sessionStorage instead of localStorage
- Keys cleared when browser closes
- Still vulnerable to XSS
- User re-enters key each session

**Option C: Client-Side Only (Current Proposal)**
- Store in localStorage with Base64 obfuscation
- Clear warning to users about risks
- Recommend using restricted API keys
- Document: "Only use API keys with spending limits"
- Add "Clear Key" button for easy removal

**Implementation Note:**
- Start with Option C for MVP
- Plan migration path to Option A
- Add security warnings prominently in UI
- Consider adding key validation and spending limit checks

#### 5.2 User Warnings
Display in settings panel:
```
⚠️ SECURITY WARNING
Your API key will be stored in your browser's local storage. This is NOT secure.
Only use API keys with strict spending limits. Never share this device with untrusted users.
For production use, contact your administrator about using a secure API proxy.
```

#### 5.3 API Key Best Practices (User Documentation)
- Use OpenAI API keys with usage limits
- Rotate keys regularly
- Never share keys
- Clear key after use on shared devices
- Monitor OpenAI dashboard for unexpected usage

### 6. UI/UX Design

#### 6.1 Chat Window Layout
```
┌─────────────────────────────────────┐
│  Library Panel Header               │
│  🧩 Component Library    [🤖 AI]    │ ← Toggle button
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  Chat Messages (Scrollable)         │
│  ┌───────────────────────────────┐  │
│  │ User: Create a card component │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ AI: Here's a card component:  │  │
│  │ [JSON Preview]                │  │
│  │ [Add to Library] [Edit]       │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  [Type your message here...] [Send] │
└─────────────────────────────────────┘
```

#### 6.2 Responsive Behavior
- **Desktop**: Chat window as sidebar or overlay (300-400px wide)
- **Mobile**: Full-screen modal when open
- Smooth transitions (slide in/out)
- Keyboard shortcuts: ESC to close, Enter to send

#### 6.3 Accessibility
- Proper ARIA labels
- Keyboard navigation
- Screen reader announcements for messages
- Focus management when opening/closing

### 7. Implementation Phases

#### Phase 1: Basic Infrastructure (Week 1)
- [ ] Create OpenAI service with API integration
- [ ] Add API key settings component
- [ ] Implement key storage and validation
- [ ] Add basic error handling
- [ ] Write unit tests for API service

**Deliverable:** API service can successfully call OpenAI and return responses

#### Phase 2: Chat Interface (Week 2)
- [ ] Create ChatWindow component
- [ ] Implement message history UI
- [ ] Add input area and send functionality
- [ ] Integrate with OpenAI service
- [ ] Add loading states and error displays
- [ ] Implement chat history persistence

**Deliverable:** Users can send messages and receive AI responses

#### Phase 3: Component Generation (Week 2)
- [ ] Design and test system prompt
- [ ] Implement JSON parsing and validation
- [ ] Add component preview in chat
- [ ] Create "Add to Library" flow
- [ ] Integrate with existing component storage
- [ ] Handle generation errors gracefully

**Deliverable:** Users can generate and save components via chat

#### Phase 4: Polish & Features (Week 3)
- [ ] Add conversation context management
- [ ] Implement component editing modal
- [ ] Add "Try Again" / regeneration
- [ ] Create example prompts/templates
- [ ] Add token usage tracking (optional)
- [ ] Implement chat history management
- [ ] Add copy to clipboard functionality

**Deliverable:** Feature-complete chat interface with all bells and whistles

#### Phase 5: Testing & Documentation (Week 3-4)
- [ ] Write comprehensive unit tests
- [ ] Add integration tests
- [ ] Create user documentation
- [ ] Add inline help/tooltips
- [ ] Security audit
- [ ] Performance testing
- [ ] Accessibility testing

**Deliverable:** Production-ready feature with full test coverage

### 8. Technical Architecture

#### 8.1 New Files to Create
```
src/
  services/
    openai.service.ts       # OpenAI API integration
    openai.types.ts         # TypeScript interfaces
  ui/
    ChatWindow.tsx          # Main chat interface
    ChatWindow.css          # Chat styling
    ChatMessage.tsx         # Individual message component
    ApiKeySettings.tsx      # API key configuration
    ComponentPreview.tsx    # Preview in chat (or reuse existing)
  utils/
    chat.utils.ts           # Chat state management
    encryption.utils.ts     # Basic key obfuscation
    prompt.templates.ts     # System prompts and examples
  __tests__/
    openai.service.spec.ts
    ChatWindow.spec.tsx
    chat.utils.spec.ts
```

#### 8.2 Modified Files
```
src/ui/LibraryPanel.tsx     # Add chat toggle button and integration
src/ui/LibraryPanel.css     # Add chat-related styles
package.json                # Add dependencies (if needed)
```

#### 8.3 Dependencies
Check if these are needed (most should work with native fetch):
```json
{
  "dependencies": {
    // OpenAI SDK (optional, can use fetch API)
    // "openai": "^4.0.0",
    
    // For better JSON syntax highlighting in chat (optional)
    // "react-syntax-highlighter": "^15.5.0"
  }
}
```

**Recommendation:** Use native `fetch` API to avoid additional dependencies. Implement basic JSON formatting without syntax highlighting library.

### 9. Example Prompts (User Documentation)

#### Simple Components
- "Create a button with hover effects"
- "Make a card with an image and text"
- "Design a modal dialog"
- "Create a loading spinner"

#### Complex Components
- "Create a pricing table with three tiers"
- "Make a testimonial card with avatar, quote, and rating"
- "Design a feature showcase with icon, title, and description"
- "Create a progress bar with percentage display"

#### Iterative Refinement
```
User: Create a button
AI: [generates button]
User: Make it blue with rounded corners
AI: [updates button]
User: Add a shadow on hover
AI: [refines button]
```

### 10. Testing Strategy

#### 10.1 Unit Tests
- `openai.service.spec.ts`: Mock API calls, test error handling
- `chat.utils.spec.ts`: Test message storage and retrieval
- `ChatWindow.spec.tsx`: Test UI interactions and state management

#### 10.2 Integration Tests
- Complete flow: User message → API → Validation → Storage
- Error scenarios: Invalid API key, network errors, validation failures
- Context management: Multi-turn conversations

#### 10.3 Manual Testing Checklist
- [ ] API key validation with valid/invalid keys
- [ ] Component generation with various prompts
- [ ] Error handling (network, rate limits, invalid JSON)
- [ ] Conversation context across multiple messages
- [ ] Component preview rendering
- [ ] Save to library functionality
- [ ] Chat history persistence
- [ ] Settings panel configuration
- [ ] Mobile responsiveness
- [ ] Accessibility with screen reader

### 11. Success Criteria

**Must Have:**
- ✅ Users can enter OpenAI API key in settings
- ✅ Users can describe components in natural language
- ✅ AI generates valid component JSON
- ✅ Generated components can be added to library
- ✅ Error handling for all failure scenarios
- ✅ Security warnings about API key storage

**Should Have:**
- ✅ Conversation context for iterative refinement
- ✅ Component preview before saving
- ✅ Chat history persistence
- ✅ Example prompts/help text
- ✅ Copy JSON to clipboard

**Nice to Have:**
- ⭐ Syntax highlighting for JSON
- ⭐ Token usage tracking
- ⭐ Multiple model selection (GPT-4, GPT-3.5)
- ⭐ Export/import chat history
- ⭐ Component templates/presets
- ⭐ Backend proxy for secure API key handling

### 12. Risks & Mitigations

#### Risk 1: API Key Security
**Risk:** API keys in localStorage are not secure
**Impact:** High - Potential unauthorized usage and billing
**Mitigation:**
- Clear security warnings in UI
- Document best practices (spending limits)
- Plan backend proxy for production
- Add clear key button for shared devices

#### Risk 2: API Costs
**Risk:** Users may generate excessive API calls
**Impact:** Medium - High OpenAI API costs for users
**Mitigation:**
- Show token usage in UI
- Recommend spending limits on API keys
- Add rate limiting on frontend (e.g., max 10 requests/minute)
- Cache common requests

#### Risk 3: Invalid AI Responses
**Risk:** AI may generate invalid or malformed JSON
**Impact:** Medium - Poor user experience
**Mitigation:**
- Robust JSON parsing and validation
- Clear error messages with retry option
- Well-crafted system prompt with examples
- Fallback to manual editing

#### Risk 4: Poor Component Quality
**Risk:** Generated components may not match user expectations
**Impact:** Medium - User frustration
**Mitigation:**
- Allow iterative refinement in conversation
- Provide edit functionality before saving
- Include quality examples in system prompt
- Add feedback mechanism

### 13. Open Questions

1. **Model Selection:**
   - Which OpenAI model(s) should we support?
   - Default: GPT-4-turbo or GPT-3.5-turbo?
   - Allow user selection?

2. **Token Limits:**
   - What should be the max_tokens limit?
   - How to handle long conversations that exceed context window?

3. **Component Examples:**
   - Which example components should be included in system prompt?
   - Should we include all examples or curate a subset?

4. **Backend Proxy:**
   - Should we implement backend proxy in Phase 1 or later?
   - What's the infrastructure requirement?

5. **Rate Limiting:**
   - Should we implement frontend rate limiting?
   - What's a reasonable limit?

6. **Chat History:**
   - How many messages to keep in context?
   - How long to persist history?
   - Should we allow exporting chat history?

7. **UI Layout:**
   - Should chat be a sidebar, modal, or bottom panel?
   - Should it be dockable/resizable?

8. **Component Preview:**
   - Should we render live preview in chat or just show JSON?
   - What if preview rendering fails?

### 14. Documentation Requirements

#### 14.1 User Documentation
- How to get an OpenAI API key
- How to set up API key in settings
- Example prompts and best practices
- Security considerations
- Troubleshooting guide

#### 14.2 Developer Documentation
- OpenAI service API reference
- System prompt design rationale
- Component schema requirements
- Testing guide
- Extension points for custom models

### 15. Future Enhancements

**Phase 2 Features (Post-MVP):**
- Support for other AI providers (Anthropic Claude, local models)
- Component library/gallery of AI-generated components
- Sharing generated components with team
- Version control for AI-generated components
- A/B testing of different system prompts
- Fine-tuned model for RenderX components
- Voice input for component generation
- Image upload for visual component design
- Component generation from screenshots
- Batch generation of multiple components

**Advanced Features:**
- Backend proxy with team API key management
- Usage analytics and cost tracking
- Component generation from Figma/design files
- Integration with component marketplace
- Collaborative chat sessions
- AI-powered component optimization suggestions

---

## Acceptance Criteria

This feature will be considered complete when:

1. ✅ Users can configure OpenAI API key in settings panel
2. ✅ Users can open a chat window from the Library Panel
3. ✅ Users can describe components in natural language
4. ✅ System generates valid component JSON using OpenAI API
5. ✅ Generated components are validated against schema
6. ✅ Users can preview components before adding to library
7. ✅ Users can add generated components to custom library
8. ✅ Conversation context is maintained for iterative refinement
9. ✅ Errors are handled gracefully with user-friendly messages
10. ✅ Security warnings about API key storage are displayed
11. ✅ Chat history persists across sessions
12. ✅ All functionality is tested with unit and integration tests
13. ✅ User documentation is complete

---

## Estimated Effort
- **Development:** 3-4 weeks (1 developer)
- **Testing:** 1 week
- **Documentation:** 3-4 days
- **Total:** ~5 weeks

## Priority
**Medium-High** - Significant value-add for user experience, but not blocking core functionality.

## Labels
`enhancement`, `ai`, `openai`, `ui`, `component-library`, `needs-discussion`

---

## Related Issues
- #XXX - Custom Components Category with Drag-and-Drop Upload (prerequisite)

## References
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [OpenAI Best Practices](https://platform.openai.com/docs/guides/production-best-practices)
- RenderX Component Schema Documentation
- Existing Custom Components in `/examples/`
