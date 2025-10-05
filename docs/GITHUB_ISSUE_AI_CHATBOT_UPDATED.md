# 🤖 Feature Request: AI-Powered Component Generator with Chat Interface

## 📝 Summary
Add an AI-powered chat interface to the Component Library panel that allows users to describe components in natural language and have them automatically generated using OpenAI's API. The generated components will be validated and can be directly added to the custom components library.

**User Story:** As a user, I want to describe a component in plain English and have it automatically generated so that I can create components without knowing JSON syntax.

**Example Flow:**
```
User: "Create a blue button with rounded corners and a hover effect"
AI: [Generates valid component JSON]
User: [Clicks "Add to Library"]
→ Component appears in Custom Components category
```

---

## 🎯 Motivation

### Current State
- Users can upload custom components via drag-and-drop JSON files
- Requires knowledge of component schema and JSON syntax
- High barrier for non-technical users

### Desired State
- Users can describe components in natural language
- AI generates valid, ready-to-use components
- Lower barrier to entry, faster prototyping

### Benefits
- **Non-technical users:** Create components without coding
- **Developers:** Rapid prototyping and boilerplate generation
- **Learning:** Generated components serve as examples
- **Consistency:** AI follows schema and best practices

---

## 🔗 Dependencies

### Required
- [x] Custom Components upload feature (already implemented)
- [x] **Host SDK Config Service** - For secure API key access ✅ **IMPLEMENTED**
  - See: https://github.com/BPMSoftwareSolutions/renderx-host-sdk/issues/8
  - Exports: `getConfigValue()`, `hasConfigValue()` ✅
- [ ] **Thin Host Integration** - In progress 🔄
  - See: https://github.com/BPMSoftwareSolutions/renderx-plugins-demo/issues/318
  - Provides `OPENAI_API_KEY` via config service
  - Expected: Soon

### Status
- ✅ **Host SDK Ready** - Config service implemented
- 🔄 **Thin Host In Progress** - Integration underway
- 🟢 **Ready to Start** - Can begin library plugin implementation

---

## 🔒 Security Architecture

### ✅ Secure Approach: Host SDK Config Service

**The Right Way™:**
```
Host Environment Variable (OPENAI_API_KEY)
    ↓
Host SDK Config Service
    ↓
Plugin: getConfigValue('OPENAI_API_KEY')
    ↓
OpenAI API
```

**Why This Works:**
- ✅ API key stored in host environment (server-side)
- ✅ Plugin accesses via SDK helpers
- ✅ No localStorage/sessionStorage
- ✅ No user-provided keys
- ✅ Centralized administration
- ✅ Works with E2E tests (GitHub Secrets)
- ✅ Follows RenderX architecture patterns

**Key Changes from Original Proposal:**
- ❌ **REMOVED:** User API key settings panel
- ❌ **REMOVED:** localStorage encryption utilities
- ❌ **REMOVED:** Security warnings about client-side storage
- ✅ **ADDED:** Host SDK config service integration
- ✅ **ADDED:** Feature detection via `hasConfigValue()`
- ✅ **ADDED:** Administrator-focused setup docs

---

## ✨ Features

### 1. Chat Interface
- Toggle button in Library Panel header (🤖 icon)
- Collapsible chat window with message history
- Text input with send button
- Loading indicator during generation
- Message bubbles (user vs AI)
- **Feature Detection:** Only shows when `hasConfigValue('OPENAI_API_KEY')` is true

### 2. Component Generation
- Natural language input → OpenAI API → Component JSON
- Validation against existing component schema
- Preview with action buttons:
  - "Add to Library" - Saves to custom components
  - "Edit JSON" - Opens editor modal
  - "Try Again" - Regenerates with feedback
  - "Copy JSON" - Clipboard copy

### 3. Configuration Status UI
- Show "AI Available" when configured
- Show "AI Unavailable - Contact Admin" when not configured
- Display which AI model is active (GPT-4, GPT-3.5, etc.)
- Link to setup documentation for administrators

### 4. Conversation Context
- Multi-turn conversations for refinement
- "Make it blue" after initial generation
- Context maintained across messages

### 5. Chat History
- Persist conversations in localStorage (chat history only, not keys!)
- Load previous chats on open
- Clear history option

---

## 🏗️ Technical Implementation

### Phase 1: Core Files

#### New Files (~1,600 lines)
```
src/
  services/
    ├── openai.service.ts       # OpenAI API integration with config service
    └── openai.types.ts         # TypeScript interfaces

  ui/
    ├── ChatWindow.tsx          # Main chat component
    ├── ChatWindow.css          # Styling
    ├── ChatMessage.tsx         # Message component
    └── ConfigStatusUI.tsx      # Shows if AI is enabled/disabled

  utils/
    ├── chat.utils.ts           # Chat state management
    └── prompt.templates.ts     # System prompts

  __tests__/
    ├── openai.service.spec.ts
    ├── ChatWindow.spec.tsx
    └── config-integration.spec.ts
```

#### Modified Files (~100 lines)
```
src/ui/
  ├── LibraryPanel.tsx          # Add chat toggle + feature detection
  └── LibraryPanel.css          # Chat styles
```

#### Reused (No Changes)
```
src/utils/
  ├── validation.utils.ts       # Existing component validation
  └── storage.utils.ts          # Existing localStorage for components
```

---

## 📋 Implementation Details

### 1. OpenAI Service with Config Service

```typescript
// src/services/openai.service.ts
import { getConfigValue, hasConfigValue } from '@renderx-plugins/host-sdk';

export class OpenAIService {
  private apiKey?: string;
  private model: string;
  private baseURL = 'https://api.openai.com/v1';

  constructor() {
    // Get API key from host config service
    this.apiKey = getConfigValue('OPENAI_API_KEY');
    this.model = getConfigValue('OPENAI_MODEL') || 'gpt-4-turbo-preview';
  }

  /**
   * Check if OpenAI is configured and ready to use
   */
  static isConfigured(): boolean {
    return hasConfigValue('OPENAI_API_KEY');
  }

  /**
   * Get configuration status for UI display
   */
  getConfigStatus(): ConfigStatus {
    if (!this.apiKey) {
      return {
        configured: false,
        message: 'OpenAI API key not configured',
        instructions: 'Contact your administrator to enable AI features'
      };
    }

    return {
      configured: true,
      model: this.model,
      message: 'AI Component Generation Ready'
    };
  }

  /**
   * Generate component from natural language prompt
   */
  async generateComponent(
    prompt: string,
    context?: ChatMessage[]
  ): Promise<GenerateComponentResponse> {
    if (!this.apiKey) {
      throw new Error(
        'OpenAI API key not configured. Please contact your administrator.'
      );
    }

    try {
      const messages = [
        { role: 'system', content: this.getSystemPrompt() },
        ...(context || []).map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: prompt }
      ];

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseResponse(data);
    } catch (error) {
      console.error('OpenAI generation failed:', error);
      throw new Error('Failed to generate component. Please try again.');
    }
  }

  private getSystemPrompt(): string {
    return `You are a component generator for the RenderX platform.
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

Rules:
1. Always return valid JSON
2. Use Handlebars: {{variable}}, {{#if}}, {{#each}}
3. Include responsive CSS with CSS variables
4. Add library preview styles
5. Choose appropriate emoji icons
6. Keep templates semantic and accessible`;
  }

  private parseResponse(data: any): GenerateComponentResponse {
    // Extract JSON from response (might be in markdown code block)
    // Validate against schema
    // Return parsed component
  }
}
```

### 2. Feature Detection in LibraryPanel

```typescript
// src/ui/LibraryPanel.tsx
import { useState } from 'react';
import { OpenAIService } from '../services/openai.service';
import { ChatWindow } from './ChatWindow';

export function LibraryPanel() {
  const [showChat, setShowChat] = useState(false);
  const aiEnabled = OpenAIService.isConfigured();

  return (
    <div className="library-sidebar">
      <div className="library-sidebar-header">
        <h2 className="library-sidebar-title">🧩 Component Library</h2>
        
        {/* AI Chat Toggle - Only show if configured */}
        {aiEnabled && (
          <button
            className="ai-chat-toggle"
            onClick={() => setShowChat(!showChat)}
            title="AI Component Generator"
          >
            🤖 AI
          </button>
        )}

        {/* Info notice when AI not available */}
        {!aiEnabled && (
          <div className="ai-unavailable-hint" title="AI features require configuration">
            <span className="icon">💡</span>
          </div>
        )}
      </div>

      {/* Rest of library panel */}
      <div className="library-component-library">
        {/* ... existing component categories ... */}
      </div>

      {/* Chat Window */}
      {showChat && aiEnabled && (
        <ChatWindow
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          onComponentGenerated={handleCustomComponentAdded}
        />
      )}
    </div>
  );
}
```

### 3. Chat Window with Config Status

```typescript
// src/ui/ChatWindow.tsx
import { useState, useEffect } from 'react';
import { OpenAIService } from '../services/openai.service';
import { ConfigStatusUI } from './ConfigStatusUI';

export function ChatWindow({ isOpen, onClose, onComponentGenerated }) {
  const [openaiService] = useState(() => new OpenAIService());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const configStatus = openaiService.getConfigStatus();

  // If not configured, show setup instructions
  if (!configStatus.configured) {
    return (
      <div className="chat-window">
        <div className="chat-header">
          <h3>🤖 AI Component Generator</h3>
          <button onClick={onClose}>✕</button>
        </div>
        <ConfigStatusUI status={configStatus} />
      </div>
    );
  }

  const handleSendMessage = async (prompt: string) => {
    try {
      setLoading(true);
      
      // Add user message
      const userMessage = { role: 'user', content: prompt };
      setMessages(prev => [...prev, userMessage]);

      // Generate component
      const result = await openaiService.generateComponent(prompt, messages);

      // Add AI response
      const aiMessage = {
        role: 'assistant',
        content: result.explanation,
        component: result.component
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      // Handle error
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message}`,
        error: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>🤖 AI Component Generator</h3>
        <span className="model-badge">{configStatus.model}</span>
        <button onClick={onClose}>✕</button>
      </div>
      
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <ChatMessage
            key={idx}
            message={msg}
            onAddToLibrary={onComponentGenerated}
          />
        ))}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Describe a component..."
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !loading) {
              handleSendMessage(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
        />
        <button disabled={loading}>
          {loading ? '⏳' : '📤'}
        </button>
      </div>
    </div>
  );
}
```

### 4. Configuration Status UI

```typescript
// src/ui/ConfigStatusUI.tsx
export interface ConfigStatus {
  configured: boolean;
  message: string;
  instructions?: string;
  model?: string;
}

export function ConfigStatusUI({ status }: { status: ConfigStatus }) {
  if (!status.configured) {
    return (
      <div className="config-status-panel not-configured">
        <div className="icon">⚙️</div>
        <h4>AI Features Not Available</h4>
        <p className="message">{status.message}</p>
        <p className="instructions">{status.instructions}</p>

        <div className="setup-guide">
          <h5>For Administrators:</h5>
          <ol>
            <li>
              Get an API key from{' '}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">
                OpenAI
              </a>
            </li>
            <li>
              Set environment variable:
              <pre>OPENAI_API_KEY=sk-your-key-here</pre>
            </li>
            <li>Restart the application</li>
          </ol>

          <h5>For Local Development:</h5>
          <pre>{`# .env.local
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4-turbo-preview  # optional`}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="config-status-panel configured">
      <div className="icon">✅</div>
      <h4>{status.message}</h4>
      <p className="model">Model: {status.model}</p>
    </div>
  );
}
```

---

## 📅 Implementation Plan

### Prerequisites (Week 0) ✅ **READY**
- [x] **Host SDK Config Service** - ✅ Implemented
  - See: https://github.com/BPMSoftwareSolutions/renderx-host-sdk/issues/8
  - `getConfigValue()` and `hasConfigValue()` available
- [ ] **Thin Host Integration** - 🔄 In Progress
  - See: https://github.com/BPMSoftwareSolutions/renderx-plugins-demo/issues/318
  - Can proceed with library plugin implementation in parallel

### Phase 1: Config Integration (Week 1)
- [ ] **Day 1-2: OpenAI Service**
  - Implement OpenAI service with config service
  - Add `isConfigured()` and `getConfigStatus()`
  - Error handling for missing keys
  - Unit tests with mocked config

- [ ] **Day 3: Feature Detection**
  - Add feature detection to LibraryPanel
  - Conditional rendering of AI button
  - Config status UI component

- [ ] **Day 4-5: Testing & Polish**
  - Integration tests with real config
  - E2E tests with environment variables
  - Documentation updates

### Phase 2: Chat Interface (Week 2)
- [ ] **Day 1-2: ChatWindow Component**
  - Message history UI
  - Input area and send functionality
  - Loading states
  - Message bubbles

- [ ] **Day 3-4: Integration**
  - Connect to OpenAI service
  - Component preview in chat
  - Action buttons (Add to Library, Edit, Copy)

- [ ] **Day 5: Chat History**
  - Persist conversation in localStorage
  - Load history on open
  - Clear history option

### Phase 3: Component Generation (Week 3)
- [ ] **Day 1-2: System Prompt**
  - Design and test system prompt
  - Include example components
  - Test with various inputs
  - Refine for quality

- [ ] **Day 3-4: Validation & Preview**
  - JSON parsing and validation
  - Component preview rendering
  - "Add to Library" flow
  - Duplicate handling

- [ ] **Day 5: Context Management**
  - Multi-turn conversation support
  - Iterative refinement
  - Context window management

### Phase 4: Testing & Documentation (Week 4)
- [ ] **Day 1-2: Comprehensive Testing**
  - Unit tests for all components
  - Integration tests
  - E2E tests
  - Error scenario testing

- [ ] **Day 3-4: Documentation**
  - User guide with example prompts
  - Administrator setup guide
  - Developer documentation
  - Update README

- [ ] **Day 5: Polish & Review**
  - Code review
  - Bug fixes
  - Performance optimization
  - Accessibility audit

---

## 🧪 Testing Strategy

### Unit Tests (with Mocked Config)

```typescript
// __tests__/openai.service.spec.ts
import { vi } from 'vitest';
import { OpenAIService } from '../services/openai.service';

vi.mock('@renderx-plugins/host-sdk', () => ({
  getConfigValue: vi.fn((key) => {
    if (key === 'OPENAI_API_KEY') return 'sk-test-123';
    if (key === 'OPENAI_MODEL') return 'gpt-4';
    return undefined;
  }),
  hasConfigValue: vi.fn((key) => key === 'OPENAI_API_KEY')
}));

describe('OpenAIService', () => {
  it('detects configuration correctly', () => {
    expect(OpenAIService.isConfigured()).toBe(true);
  });

  it('returns proper config status', () => {
    const service = new OpenAIService();
    const status = service.getConfigStatus();
    expect(status.configured).toBe(true);
  });

  it('throws error when not configured', async () => {
    vi.mocked(getConfigValue).mockReturnValue(undefined);
    const service = new OpenAIService();
    
    await expect(
      service.generateComponent('test')
    ).rejects.toThrow('not configured');
  });
});
```

### Integration Tests

```typescript
// __tests__/config-integration.spec.ts
describe('Config Service Integration', () => {
  it('feature detection works end-to-end', () => {
    // Setup window.RenderX.config
    (window as any).RenderX = {
      config: {
        get: (key: string) => key === 'OPENAI_API_KEY' ? 'sk-test' : undefined,
        has: (key: string) => key === 'OPENAI_API_KEY'
      }
    };

    expect(OpenAIService.isConfigured()).toBe(true);
  });
});
```

### E2E Tests

```typescript
// cypress/e2e/ai-config.cy.ts
describe('AI Feature Detection', () => {
  context('With API Key', () => {
    it('shows AI button when configured', () => {
      cy.visit('/?openai=enabled');
      cy.get('[data-testid="ai-chat-toggle"]').should('be.visible');
    });
  });

  context('Without API Key', () => {
    it('hides AI button when not configured', () => {
      cy.visit('/?openai=disabled');
      cy.get('[data-testid="ai-chat-toggle"]').should('not.exist');
    });

    it('shows hint icon', () => {
      cy.visit('/?openai=disabled');
      cy.get('.ai-unavailable-hint').should('be.visible');
    });
  });
});
```

---

## ✅ Acceptance Criteria

### Must Have
- [ ] OpenAI service uses `getConfigValue('OPENAI_API_KEY')`
- [ ] Feature detection uses `hasConfigValue('OPENAI_API_KEY')`
- [ ] AI chat button only shows when key is configured
- [ ] Clear UI when key is missing (ConfigStatusUI component)
- [ ] Users can describe components in natural language
- [ ] AI generates valid component JSON
- [ ] Generated components pass validation
- [ ] Components can be added to custom library
- [ ] Conversation context maintained for iterative refinement
- [ ] Errors handled gracefully with user-friendly messages
- [ ] Chat history persists across sessions (history only, not keys)
- [ ] All functionality tested with unit and integration tests
- [ ] Documentation complete (user + admin guides)

### Should Have
- [ ] Multiple AI providers support (extensible for Claude, etc.)
- [ ] Token usage tracking
- [ ] Example prompts/help text
- [ ] Copy JSON to clipboard
- [ ] Component editing before saving

### Nice to Have
- [ ] Syntax highlighting for JSON
- [ ] Model selection UI (when multiple models available)
- [ ] Export/import chat history
- [ ] Voice input (future)
- [ ] Component generation from images (future)

---

## 🔒 Security Benefits

### What We Gain ✅
- **No localStorage exposure** - API key never stored in browser
- **XSS protection** - Key not accessible to client-side JavaScript
- **Centralized control** - Administrators manage keys
- **Audit trail** - Config service can log access
- **Upgrade path** - Easy migration to backend proxy
- **E2E testable** - Works with GitHub Secrets

### Comparison to Alternatives

| Approach | Security | Effort | Recommended |
|----------|----------|--------|-------------|
| **localStorage** | ⭐ | 2 days | ❌ No |
| **sessionStorage** | ⭐⭐ | 2 days | ❌ No |
| **Config Service** | ⭐⭐⭐⭐ | 3 days | ✅ **Yes (Phase 1)** |
| **Backend Proxy** | ⭐⭐⭐⭐⭐ | 1 week | ✅ Yes (Phase 2) |

---

## 💰 Cost Analysis

### OpenAI API Pricing (Organization Pays)

**GPT-4-Turbo:**
- Input: ~$10 / 1M tokens
- Output: ~$30 / 1M tokens
- **~$0.02-0.05 per component**

**GPT-3.5-Turbo:** (Recommended default)
- Input: ~$0.50 / 1M tokens
- Output: ~$1.50 / 1M tokens
- **~$0.002-0.005 per component**

**Cost Control:**
- Administrator sets spending limits via OpenAI dashboard
- Monitor usage in OpenAI account
- Consider rate limiting in backend proxy (Phase 2)
- Default to cheaper GPT-3.5-turbo model

---

## 📖 Documentation Required

### For End Users
- [ ] How to use AI chat to generate components
- [ ] Example prompts and best practices
- [ ] What to do when AI features are disabled
- [ ] Limitations and known issues

### For Administrators
- [ ] How to set `OPENAI_API_KEY` environment variable
- [ ] GitHub Secrets setup for E2E tests
- [ ] Local development with `.env.local`
- [ ] Spending limits and monitoring
- [ ] Troubleshooting guide

### For Developers
- [ ] Config service integration patterns
- [ ] Testing with mocked config
- [ ] System prompt design rationale
- [ ] Extension points for other AI providers

---

## 🎓 Key Architectural Decisions

### Why Config Service over localStorage?

1. **Security First:** No client-side key exposure
2. **Architecture Fit:** Follows RenderX plugin patterns
3. **Testability:** Easy to mock in tests
4. **E2E Ready:** Works with GitHub Secrets
5. **Scalable:** Clear path to backend proxy

### Why Not User-Provided Keys?

- ❌ Security risk (XSS vulnerabilities)
- ❌ Poor UX (each user needs account)
- ❌ Cost tracking complexity
- ❌ Support burden (key issues)
- ✅ Organization control is better

### Backend Proxy (Phase 2)

**When to implement:**
- Multiple plugins need AI features
- Need usage analytics and logging
- Want rate limiting and caching
- Production deployment with public access

**Benefits:**
- Zero client-side key exposure
- Centralized logging and monitoring
- Request caching for common prompts
- Rate limiting per user/session
- Cost tracking and budgets

---

## 🔮 Future Enhancements

### Phase 2 (Post-MVP)
- Backend proxy for zero client exposure
- Other AI providers (Anthropic Claude, Gemini)
- Model selection UI
- Token usage statistics
- Rate limiting

### Phase 3 (Advanced)
- Voice input for component generation
- Image-to-component (upload design screenshot)
- Component marketplace integration
- Fine-tuned model for RenderX components
- Collaborative chat sessions
- A/B testing of system prompts

---

## 📊 Success Metrics

### Technical
- 90%+ test coverage
- <2s average OpenAI response time
- <5% invalid JSON response rate
- Zero API key leakage

### User Experience
- Generate component in <60 seconds
- 80%+ usable without edits
- <10% error rate
- Positive user feedback

### Business
- 50% faster component creation
- 3x more components created
- Reduced support tickets for JSON syntax

---

## 📦 Estimated Effort

| Phase | Task | Effort | Dependencies |
|-------|------|--------|--------------|
| **Prerequisites** | Wait for Config Service | N/A | Host SDK team |
| **Phase 1** | Config Integration | 3 days | Config Service ready |
| **Phase 2** | Chat Interface | 5 days | Phase 1 done |
| **Phase 3** | Component Generation | 5 days | Phase 2 done |
| **Phase 4** | Testing & Docs | 5 days | Phase 3 done |
| **Total** | | **18 days** | **~4 weeks (1 dev)** |

---

## 🏷️ Labels

`enhancement` `ai` `openai` `feature` `ui` `component-library` `security` `config-service` `ready-to-start`

---

## 🔗 Related Issues

### Blocks
- N/A (this is a new feature)

### Depends On (In Progress)
- **Thin Host Config Integration** - 🔄 In Progress
  - See: https://github.com/BPMSoftwareSolutions/renderx-plugins-demo/issues/318
  - Provides `OPENAI_API_KEY` to plugin via config service
  - Can proceed with plugin implementation in parallel

### Built On (Implemented)
- **Host SDK Config Service** - ✅ Completed
  - See: https://github.com/BPMSoftwareSolutions/renderx-host-sdk/issues/8
  - Provides `getConfigValue()` and `hasConfigValue()` helpers

### Related
- Custom Components Category with Drag-and-Drop Upload (prerequisite - done)
- Component validation and storage (reuses existing)

---

## 📞 Open Questions for Discussion

1. **Default Model:** GPT-4 (better quality) or GPT-3.5-turbo (cheaper)?
   - **Recommendation:** GPT-3.5-turbo for cost, allow override via `OPENAI_MODEL`

2. **Backend Proxy:** Implement in Phase 1 or Phase 2?
   - **Recommendation:** Phase 2 (config service is good enough for MVP)

3. **Multiple AI Providers:** Support Claude, Gemini from day 1?
   - **Recommendation:** Design for it, implement OpenAI only in Phase 1

4. **Rate Limiting:** Frontend throttling or wait for backend?
   - **Recommendation:** Simple frontend throttling in Phase 1

5. **Token Limits:** Max tokens per request?
   - **Recommendation:** 2000 tokens (enough for components, not wasteful)

6. **Model Selection:** Allow users to choose model or admin-only config?
   - **Recommendation:** Admin-only via `OPENAI_MODEL` env var in Phase 1

---

## 💬 Discussion Points

### For Team Review
- Does config service timeline align with our schedule?
- Should we prototype system prompt while waiting?
- Any concerns about OpenAI API costs?
- Backend proxy priority (Phase 2 vs later)?

### For Security Review
- Is config service approach secure enough for production?
- Do we need additional rate limiting?
- Any compliance concerns with OpenAI?

### For UX Review
- Chat window placement (sidebar vs modal)?
- Disabled state messaging clear enough?
- Example prompts needed in UI?

---

## 📝 Next Steps

1. ✅ **Review this issue** with team
2. ✅ **Host SDK Config Service** - Implemented! 🎉
   - See: https://github.com/BPMSoftwareSolutions/renderx-host-sdk/issues/8
3. 🔄 **Monitor thin host integration** - In progress
   - See: https://github.com/BPMSoftwareSolutions/renderx-plugins-demo/issues/318
4. 🟢 **Begin plugin implementation** - Can start now!
   - Implement OpenAI service with config service integration
   - Build chat interface
   - Add component generation
5. ✅ **Prototype system prompt** in OpenAI Playground
6. ✅ **Iterative testing** with real prompts
7. ✅ **Launch** MVP - 4 weeks from start

---

**Created:** October 5, 2025  
**Updated:** October 5, 2025 (Config Service Ready!)  
**Status:** � Ready to Start (Host SDK Config Service Implemented ✅)  
**Priority:** 🟡 Medium-High  
**Complexity:** 🟡 Medium (config service foundation ready)  
**Estimated Timeline:** 4 weeks (1 developer)

---

## 🔗 Implementation References

- **Host SDK Config Service:** https://github.com/BPMSoftwareSolutions/renderx-host-sdk/issues/8 ✅
- **Thin Host Integration:** https://github.com/BPMSoftwareSolutions/renderx-plugins-demo/issues/318 🔄
- **This Issue:** Library Plugin AI Chatbot Implementation
