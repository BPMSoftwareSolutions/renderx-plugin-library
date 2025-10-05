# 🔐 Integrate Host SDK Config Service for Secure API Key Management

## 📝 Summary
Update the Library plugin to use the Host SDK's new Configuration Service for secure API key management, replacing the proposed localStorage approach.

**User Story:** As a Library plugin developer, I want to securely access the OpenAI API key provided by the host so that the AI Chatbot feature can function without exposing secrets in browser storage.

**Example Flow:**
```typescript
// In Library plugin
import { getConfigValue, hasConfigValue } from '@renderx-plugins/host-sdk';

const apiKey = getConfigValue('OPENAI_API_KEY');
if (apiKey) {
  const openai = new OpenAIService(apiKey);
  // Use service for AI features
}
```

---

## 🎯 Motivation

### Previous Approach (From AI Chatbot Issue)
- ❌ Store API key in localStorage
- ❌ Security warnings to users
- ❌ Each user provides their own key
- ❌ High risk of key exposure

### New Approach (Host SDK Config Service)
- ✅ Host manages API key via config service
- ✅ Plugin accesses via SDK helpers
- ✅ Works with E2E environment variables
- ✅ Clear upgrade path to backend proxy
- ✅ Respects architecture boundaries

### Benefits
- **Security:** No localStorage exposure
- **Architecture:** Proper plugin/host separation
- **E2E:** Works seamlessly with CI/CD
- **DX:** Simple SDK API for plugin devs
- **Scalability:** Backend proxy upgrade path

---

## 🔗 Dependencies

### Required
- [ ] Host SDK Config Service implementation (see `renderx-plugins-demo/docs/host-sdk/GITHUB_ISSUE_CONFIG_SERVICE.md`)
- [ ] Host SDK exports: `getConfigValue()`, `hasConfigValue()`
- [ ] `window.RenderX.config` available in host

### Timeline
- This feature **blocks** AI Chatbot implementation
- Should be implemented **after** Host SDK Config Service (Phase 1)
- Can proceed once SDK exports are available

---

## ✨ Features

### 1. Config Service Integration
- Import SDK config helpers in OpenAI service
- Check for API key availability
- Handle missing key gracefully
- Show appropriate UI when key is missing/present

### 2. Feature Detection
- Use `hasConfigValue('OPENAI_API_KEY')` for feature flags
- Show/hide AI features based on config availability
- Display setup instructions when key missing
- No user-facing API key input (Phase 1)

### 3. OpenAI Service Layer
- Abstraction over OpenAI API calls
- Uses config service for authentication
- Error handling for missing/invalid keys
- Retry logic and rate limiting

### 4. Development Experience
- Works with `.env.local` for local dev
- E2E tests use GitHub Secrets
- Clear error messages when misconfigured
- Documentation for plugin developers

---

## 🏗️ Technical Implementation

### Modified Files
```
src/
  ├── services/
  │   ├── openai.service.ts             # Use config service for API key
  │   └── openai.types.ts               # Type definitions
  │
  ├── ui/
  │   ├── LibraryPanel.tsx              # Feature detection
  │   ├── ChatWindow.tsx                # Config-aware UI
  │   └── ApiKeySettings.tsx            # Phase 2: Proxy settings
  │
  └── utils/
      └── config.utils.ts               # Config helpers

__tests__/
  ├── openai.service.spec.ts            # Mock config service
  ├── config.integration.spec.ts        # Integration tests
  └── feature-detection.spec.ts         # Feature flag tests

docs/
  └── CONFIG_INTEGRATION.md             # Usage documentation
```

### New Files (Minimal)
```
src/utils/config.utils.ts               # Wrapper/helper functions
docs/CONFIG_INTEGRATION.md              # Developer guide
```

---

## 📋 Implementation Details

### 1. OpenAI Service with Config Service

```typescript
// src/services/openai.service.ts
import { getConfigValue, hasConfigValue } from '@renderx-plugins/host-sdk';

export class OpenAIService {
  private apiKey?: string;
  private baseURL = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = getConfigValue('OPENAI_API_KEY');
  }

  /**
   * Check if OpenAI is configured and ready to use
   */
  isConfigured(): boolean {
    return hasConfigValue('OPENAI_API_KEY');
  }

  /**
   * Get configuration status for UI display
   */
  getConfigStatus(): ConfigStatus {
    if (!this.isConfigured()) {
      return {
        configured: false,
        message: 'OpenAI API key not configured',
        action: 'contact_admin'
      };
    }

    return {
      configured: true,
      message: 'OpenAI integration ready',
      action: null
    };
  }

  /**
   * Generate component from natural language prompt
   */
  async generateComponent(prompt: string, options?: GenerateOptions): Promise<ComponentJSON> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured. Please contact your administrator.');
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: options?.model || 'gpt-4',
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt()
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 2000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseComponentResponse(data);
    } catch (error) {
      console.error('OpenAI generation failed:', error);
      throw new Error('Failed to generate component. Please try again.');
    }
  }

  private getSystemPrompt(): string {
    return `You are a component generator for RenderX...`;
  }

  private parseComponentResponse(data: any): ComponentJSON {
    // Parse and validate OpenAI response
    // ...
  }
}
```

### 2. Feature Detection in UI

```typescript
// src/ui/LibraryPanel.tsx
import { hasConfigValue } from '@renderx-plugins/host-sdk';
import { useState, useEffect } from 'react';

export function LibraryPanel() {
  const [aiEnabled, setAiEnabled] = useState(false);

  useEffect(() => {
    // Check if AI features are available
    setAiEnabled(hasConfigValue('OPENAI_API_KEY'));
  }, []);

  return (
    <div className="library-panel">
      <div className="library-header">
        <h2>Component Library</h2>
        {aiEnabled && (
          <button 
            className="ai-chat-toggle"
            onClick={() => setShowAIChat(true)}
            title="AI Component Generator"
          >
            🤖 AI Assistant
          </button>
        )}
        {!aiEnabled && (
          <div className="ai-unavailable-notice">
            <span>💡 AI features require configuration</span>
          </div>
        )}
      </div>
      {/* Rest of component */}
    </div>
  );
}
```

### 3. Config Status UI

```typescript
// src/ui/ChatWindow.tsx
import { getConfigValue } from '@renderx-plugins/host-sdk';
import { OpenAIService } from '../services/openai.service';

export function ChatWindow({ isOpen, onClose }) {
  const openai = new OpenAIService();
  const status = openai.getConfigStatus();

  if (!status.configured) {
    return (
      <div className="chat-window">
        <div className="config-required">
          <h3>⚙️ Configuration Required</h3>
          <p>{status.message}</p>
          <div className="instructions">
            <h4>For Administrators:</h4>
            <p>Set the <code>OPENAI_API_KEY</code> environment variable in your deployment configuration.</p>
            
            <h4>For Local Development:</h4>
            <pre>
              {`# .env.local
OPENAI_API_KEY=sk-your-key-here`}
            </pre>
            
            <a 
              href="https://platform.openai.com/api-keys" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Get your OpenAI API key →
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Normal chat UI when configured
  return (
    <div className="chat-window">
      {/* Chat interface */}
    </div>
  );
}
```

### 4. Config Utilities (Optional Wrapper)

```typescript
// src/utils/config.utils.ts
import { getConfigValue, hasConfigValue } from '@renderx-plugins/host-sdk';

/**
 * Library-specific config helpers
 */
export const LibraryConfig = {
  /**
   * Check if OpenAI is available
   */
  hasOpenAI(): boolean {
    return hasConfigValue('OPENAI_API_KEY');
  },

  /**
   * Get OpenAI API key (for internal use only)
   */
  getOpenAIKey(): string | undefined {
    return getConfigValue('OPENAI_API_KEY');
  },

  /**
   * Get all available AI providers
   */
  getAvailableAIProviders(): AIProvider[] {
    const providers: AIProvider[] = [];

    if (hasConfigValue('OPENAI_API_KEY')) {
      providers.push({ id: 'openai', name: 'OpenAI', models: ['gpt-4', 'gpt-3.5-turbo'] });
    }

    if (hasConfigValue('ANTHROPIC_API_KEY')) {
      providers.push({ id: 'anthropic', name: 'Claude', models: ['claude-3'] });
    }

    return providers;
  },

  /**
   * Feature flags based on config
   */
  features: {
    aiChatbot: () => hasConfigValue('OPENAI_API_KEY'),
    aiImageGen: () => hasConfigValue('OPENAI_API_KEY') || hasConfigValue('STABILITY_API_KEY'),
    customAI: () => hasConfigValue('CUSTOM_AI_ENDPOINT'),
  }
};
```

---

## 📅 Implementation Plan

### Phase 1: Config Service Integration (3-4 days)
**Dependencies:** Host SDK Config Service must be complete

- [x] **Day 1: Service Layer**
  - [ ] Update OpenAI service to use `getConfigValue()`
  - [ ] Add `isConfigured()` and `getConfigStatus()` methods
  - [ ] Update error handling for missing keys
  - [ ] Write unit tests with mocked config service

- [x] **Day 2: UI Integration**
  - [ ] Add feature detection to LibraryPanel
  - [ ] Update ChatWindow with config status UI
  - [ ] Add "configuration required" screen
  - [ ] Style config notice/instructions

- [x] **Day 3: Testing**
  - [ ] Integration tests with real config service
  - [ ] E2E tests with environment variables
  - [ ] Test missing key scenarios
  - [ ] Test feature detection

- [x] **Day 4: Documentation**
  - [ ] Update plugin documentation
  - [ ] Add config setup guide
  - [ ] Document for administrators
  - [ ] Update README

### Phase 2: Backend Proxy Support (Future)
**Dependencies:** Host SDK Backend Proxy (Phase 2)

- [ ] Update OpenAI service to use proxy if available
- [ ] Fallback to direct API if proxy not configured
- [ ] Add proxy health check
- [ ] Update tests for proxy mode

---

## ✅ Acceptance Criteria

### Must Have
- [ ] OpenAI service uses `getConfigValue('OPENAI_API_KEY')`
- [ ] Feature detection uses `hasConfigValue()`
- [ ] AI chat button only shows when key is configured
- [ ] Clear UI when key is missing (not just error)
- [ ] Works in E2E tests with environment variables
- [ ] Works in local dev with `.env.local`
- [ ] No localStorage usage for API keys
- [ ] Error messages guide users to administrators
- [ ] Unit tests with mocked config service pass
- [ ] Integration tests with real config service pass

### Should Have
- [ ] Config status indicator in UI
- [ ] "Why is this disabled?" help text
- [ ] Link to setup documentation
- [ ] Graceful degradation (library works without AI)
- [ ] Multiple AI provider support (future-ready)

### Nice to Have
- [ ] Config validation (key format check)
- [ ] Test key button (verify key works)
- [ ] Usage statistics (calls remaining, etc.)
- [ ] Model selection based on available key tier

---

## 🧪 Testing Strategy

### Unit Tests (with Mocks)

```typescript
// __tests__/openai.service.spec.ts
import { describe, it, expect, vi } from 'vitest';
import { OpenAIService } from '../services/openai.service';

// Mock the Host SDK
vi.mock('@renderx-plugins/host-sdk', () => ({
  getConfigValue: vi.fn((key) => {
    if (key === 'OPENAI_API_KEY') return 'sk-test-key-123';
    return undefined;
  }),
  hasConfigValue: vi.fn((key) => key === 'OPENAI_API_KEY')
}));

describe('OpenAIService', () => {
  it('returns configured when API key is present', () => {
    const service = new OpenAIService();
    expect(service.isConfigured()).toBe(true);
  });

  it('throws error when generating without key', async () => {
    vi.mocked(getConfigValue).mockReturnValue(undefined);
    const service = new OpenAIService();
    
    await expect(service.generateComponent('test')).rejects.toThrow(
      'OpenAI API key not configured'
    );
  });

  it('returns proper config status', () => {
    const service = new OpenAIService();
    const status = service.getConfigStatus();
    
    expect(status.configured).toBe(true);
    expect(status.message).toContain('ready');
  });
});
```

### Integration Tests (with Real Config)

```typescript
// __tests__/config.integration.spec.ts
describe('Config Service Integration', () => {
  beforeEach(() => {
    // Setup window.RenderX.config
    (window as any).RenderX = {
      config: {
        get: (key: string) => key === 'OPENAI_API_KEY' ? 'sk-test' : undefined,
        has: (key: string) => key === 'OPENAI_API_KEY'
      }
    };
  });

  it('OpenAI service detects config from host', () => {
    const service = new OpenAIService();
    expect(service.isConfigured()).toBe(true);
  });

  it('feature detection works', () => {
    expect(LibraryConfig.hasOpenAI()).toBe(true);
  });
});
```

### E2E Tests

```typescript
// cypress/e2e/ai-config.cy.ts
describe('AI Config Integration', () => {
  context('With API Key', () => {
    it('shows AI chat button when configured', () => {
      cy.visit('/?test=ai-enabled');
      cy.get('[data-testid="ai-chat-toggle"]').should('be.visible');
    });

    it('can open AI chat window', () => {
      cy.visit('/?test=ai-enabled');
      cy.get('[data-testid="ai-chat-toggle"]').click();
      cy.get('[data-testid="chat-window"]').should('be.visible');
    });
  });

  context('Without API Key', () => {
    it('hides AI chat button when not configured', () => {
      cy.visit('/?test=ai-disabled');
      cy.get('[data-testid="ai-chat-toggle"]').should('not.exist');
    });

    it('shows configuration notice', () => {
      cy.visit('/?test=ai-disabled');
      cy.contains('AI features require configuration').should('be.visible');
    });
  });
});
```

---

## 🔒 Security Benefits

### What We Gain
✅ **No localStorage exposure** - Keys never stored in browser storage  
✅ **XSS protection** - Keys not accessible to arbitrary JavaScript  
✅ **Centralized control** - Administrators manage keys, not users  
✅ **Audit trail** - Config service can log access (dev mode)  
✅ **Upgrade path** - Easy migration to backend proxy later  

### What We Avoid
❌ User-provided API keys in localStorage  
❌ Key exposure in browser DevTools  
❌ Per-user key management complexity  
❌ Security warnings and user education burden  

### Comparison to Original Plan

| Aspect | Original (localStorage) | New (Config Service) |
|--------|------------------------|----------------------|
| **Security** | ❌ Low (XSS vulnerable) | ✅ Medium → High |
| **User Experience** | ❌ Each user needs key | ✅ Admin configures once |
| **Architecture** | ❌ Violates boundaries | ✅ Follows SDK patterns |
| **E2E Testing** | ⚠️ Difficult | ✅ Easy (env vars) |
| **Upgrade Path** | ❌ Requires rewrite | ✅ Transparent upgrade |
| **Spending Control** | ❌ Per-user risk | ✅ Centralized limits |

---

## 📖 Documentation Required

### For Plugin Developers
- [ ] How to use config service in plugins
- [ ] Feature detection patterns
- [ ] Error handling best practices
- [ ] Testing with mocked config

### For Administrators
- [ ] How to set environment variables
- [ ] GitHub Secrets setup for E2E
- [ ] Local development with `.env.local`
- [ ] Spending limits and monitoring

### For End Users
- [ ] Why AI features might be disabled
- [ ] Who to contact for access
- [ ] What AI features are available
- [ ] Usage guidelines and limits

---

## 🎓 Key Learnings

### Why This Approach Fits RenderX Architecture

1. **Plugin Boundaries**: Library accesses config via SDK, not host internals
2. **Thin Host Principle**: Host provides service, plugin consumes
3. **Manifest-Driven**: Config keys could be declared in plugin manifest
4. **Testability**: Easy to mock config service in tests
5. **Scalability**: Backend proxy upgrade doesn't change plugin code

### What Changes from Original Issue

- ❌ Remove: API key settings panel (Phase 1)
- ❌ Remove: localStorage encryption utilities
- ❌ Remove: User-facing API key input
- ✅ Add: Config service integration
- ✅ Add: Feature detection logic
- ✅ Add: Admin-focused documentation
- ✅ Keep: Everything else (UI, OpenAI service, chat, generation)

---

## 🔗 Related Issues

### Blocks
- AI Chatbot feature implementation (must wait for config service)

### Depends On
- Host SDK Config Service (#XXX - `renderx-plugins-demo/docs/host-sdk/GITHUB_ISSUE_CONFIG_SERVICE.md`)

### Related
- AI Chatbot original issue (update to reflect config service approach)
- Custom Components category feature
- Component validation and preview

---

## 🚀 Rollout Plan

### Week 1: Wait for Host SDK
- [ ] Monitor Host SDK config service implementation
- [ ] Review SDK API when available
- [ ] Plan integration approach
- [ ] Prepare test mocks

### Week 2: Integration
- [ ] Implement config service integration
- [ ] Update OpenAI service
- [ ] Add feature detection
- [ ] Write tests

### Week 3: Testing & Polish
- [ ] E2E testing with real environment
- [ ] Fix integration issues
- [ ] Write documentation
- [ ] Code review

### Week 4: AI Chatbot Implementation
- [ ] Build on config foundation
- [ ] Implement chat UI
- [ ] Add component generation
- [ ] Full feature testing

---

## 💬 Open Questions

1. **Fallback Behavior:** Should we provide a mock/demo mode when key is missing?
   - Recommendation: No, clean disable with clear messaging

2. **Multiple Keys:** Support multiple AI providers (OpenAI, Anthropic, etc.)?
   - Recommendation: Yes, make it extensible from the start

3. **Key Validation:** Should we test the key on startup?
   - Recommendation: No for Phase 1, maybe Phase 2 with health checks

4. **Error Messages:** Generic or specific (e.g., "invalid key" vs "configuration error")?
   - Recommendation: Generic for security, specific in logs

5. **Feature Flags:** Should AI features have separate feature flag?
   - Recommendation: Config presence IS the feature flag

---

## 📊 Success Metrics

### Technical
- Zero localStorage usage for API keys
- Works in E2E with environment variables
- <100ms config service access time
- 90%+ test coverage
- Zero key leakage in logs/DOM

### Developer Experience  
- Config integration in <20 lines of code
- Clear error messages
- Works locally with `.env.local`
- Easy to test with mocks

### Security
- No keys in browser storage
- No keys in console/DevTools
- Centralized key management
- Ready for backend proxy upgrade

---

## 📦 Estimated Effort

| Task | Effort | Dependencies |
|------|--------|--------------|
| **Config Service Integration** | 2 days | Host SDK ready |
| **UI Updates** | 1 day | Service layer done |
| **Testing** | 1 day | Implementation done |
| **Documentation** | 0.5 days | All complete |
| **Total** | **4-5 days** | **1 developer** |

---

## 🏷️ Labels

`enhancement` `security` `config-service` `ai` `openai` `library-plugin` `dependencies` `blocked-by-host-sdk`

---

**Created:** October 5, 2025  
**Status:** 🔴 Blocked (Waiting for Host SDK Config Service)  
**Priority:** 🔴 High (Required for AI Chatbot)  
**Complexity:** 🟢 Low (Simple SDK integration)  
**Blocks:** AI Chatbot Implementation
