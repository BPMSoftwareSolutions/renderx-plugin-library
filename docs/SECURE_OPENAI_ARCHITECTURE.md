# Revised Architecture: Secure OpenAI API Key via Host Environment

## 🎉 Major Security Improvement!

Instead of storing the OpenAI API key in browser localStorage (insecure), we can **pass it securely from the thin host** via the conductor.

## How It Works

### 1. Host Setup (Thin Host Repo)
```typescript
// In thin host repo - server-side or build-time
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Pass to conductor config
const conductorConfig = {
  plugins: {
    library: {
      openai: {
        apiKey: OPENAI_API_KEY,
        model: 'gpt-4-turbo-preview',
        enabled: !!OPENAI_API_KEY
      }
    }
  }
};

// Initialize conductor with config
const conductor = new Conductor(conductorConfig);
```

### 2. Plugin Access (This Package)
```typescript
// In register function
export async function register(conductor: any) {
  // Access config passed from host
  const config = conductor?.config?.plugins?.library?.openai;
  
  if (config?.enabled && config?.apiKey) {
    // Store in plugin context (not localStorage!)
    // Pass to ChatWindow via React Context or conductor
  }
  
  // ... rest of registration
}
```

### 3. Component Access (ChatWindow)
```typescript
// In ChatWindow.tsx
import { useConductor } from "@renderx-plugins/host-sdk";

export function ChatWindow() {
  const conductor = useConductor();
  
  // Access OpenAI config from conductor
  const openaiConfig = conductor?.config?.plugins?.library?.openai;
  
  // Use config to make API calls (key never exposed to client)
  const handleGenerateComponent = async (prompt: string) => {
    if (!openaiConfig?.apiKey) {
      setError("OpenAI is not configured. Contact your administrator.");
      return;
    }
    
    const response = await openaiService.generateComponent(
      { prompt },
      openaiConfig
    );
    // ... handle response
  };
}
```

## Architecture Options

### Option A: Server-Side Proxy (Most Secure) ⭐⭐⭐⭐⭐

```
Browser                  Host Server              OpenAI API
  ↓                           ↓                       ↓
ChatWindow  →  POST /api/generate  →  Server Handler  →  OpenAI
              (prompt only)         (uses OPENAI_API_KEY)
```

**Pros:**
- API key **never** sent to client
- Complete server-side control
- Rate limiting on server
- Usage monitoring and logging
- Team can share organization key

**Cons:**
- Requires backend endpoint
- More complex deployment

**Implementation:**
```typescript
// Host server endpoint
app.post('/api/generate-component', async (req, res) => {
  const { prompt, context } = req.body;
  
  // Server-side OpenAI call
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...context,
        { role: 'user', content: prompt }
      ]
    })
  });
  
  const data = await response.json();
  res.json(data);
});

// Plugin makes request to host server
const response = await fetch('/api/generate-component', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt, context })
});
```

### Option B: Build-Time Injection (Medium Security) ⭐⭐⭐

```
Build Time: OPENAI_API_KEY → Bundle → Runtime (obfuscated in code)
```

**Pros:**
- No backend required
- Simple implementation
- Key bundled securely-ish

**Cons:**
- Key still in client bundle (can be extracted)
- Anyone with bundle can find key
- Need rebuild to rotate keys
- Not suitable for public deployments

**Implementation:**
```typescript
// vite.config.ts or webpack config
export default defineConfig({
  define: {
    '__OPENAI_API_KEY__': JSON.stringify(process.env.OPENAI_API_KEY)
  }
});

// In plugin code
const OPENAI_API_KEY = typeof __OPENAI_API_KEY__ !== 'undefined' 
  ? __OPENAI_API_KEY__ 
  : null;
```

### Option C: Runtime Config via Conductor (Best Balance) ⭐⭐⭐⭐

```
Host App Init → Conductor Config → Plugin Access via useConductor()
```

**Pros:**
- Key passed at runtime (not in bundle)
- Can be from server-side rendered config
- Centralized management
- Easy to toggle on/off
- No localStorage needed

**Cons:**
- Key still accessible in browser memory
- Can be intercepted in DevTools
- Better than localStorage but not perfect

**Implementation:**
```typescript
// Host initialization (server-side rendered or from secure endpoint)
const config = await fetch('/api/config').then(r => r.json());

const conductor = new Conductor({
  plugins: {
    library: {
      openai: config.openai // { apiKey, model, enabled }
    }
  }
});

// Plugin accesses via conductor
const openaiConfig = conductor?.config?.plugins?.library?.openai;
```

## Recommended Approach: Hybrid (Option A + C)

### Phase 1: Runtime Config via Conductor
- Quick to implement
- Significant improvement over localStorage
- Host controls API key
- Key passed at runtime, not stored in browser

### Phase 2: Server-Side Proxy
- Full security
- Add `/api/generate-component` endpoint
- Plugin calls host server instead of OpenAI directly
- Zero client-side key exposure

## Implementation Changes

### Updated File Structure

```diff
src/
  services/
    openai.service.ts       # Modified: Accept config from conductor
    openai.types.ts         # Same
  ui/
    ChatWindow.tsx          # Modified: Get config from conductor
-   ApiKeySettings.tsx      # REMOVED: No user-provided keys!
+   OpenAIStatus.tsx        # NEW: Show if OpenAI is enabled/disabled
    ChatWindow.css
    ChatMessage.tsx
  utils/
    chat.utils.ts
-   encryption.utils.ts     # REMOVED: No client-side key storage!
    prompt.templates.ts
```

### Key Changes

#### 1. Remove User API Key Input
**Before:**
```typescript
// ApiKeySettings.tsx - Users enter their own keys ❌
<input type="password" placeholder="Enter OpenAI API key" />
```

**After:**
```typescript
// OpenAIStatus.tsx - Show system status only ✅
{openaiEnabled ? (
  <div className="openai-status enabled">
    ✅ AI Component Generation Enabled
    <span className="model">{model}</span>
  </div>
) : (
  <div className="openai-status disabled">
    ❌ AI features disabled. Contact your administrator.
  </div>
)}
```

#### 2. Access Config from Conductor
```typescript
// src/services/openai.service.ts
export class OpenAIService {
  async generateComponent(
    prompt: string,
    conductorConfig: any
  ): Promise<GenerateComponentResponse> {
    const openaiConfig = conductorConfig?.plugins?.library?.openai;
    
    if (!openaiConfig?.enabled || !openaiConfig?.apiKey) {
      throw new Error('OpenAI is not configured');
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiConfig.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: openaiConfig.model || 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ]
      })
    });
    
    return this.parseResponse(await response.json());
  }
}
```

#### 3. ChatWindow Uses Conductor Config
```typescript
// src/ui/ChatWindow.tsx
import { useConductor } from "@renderx-plugins/host-sdk";

export function ChatWindow() {
  const conductor = useConductor();
  const openaiConfig = conductor?.config?.plugins?.library?.openai;
  const isEnabled = openaiConfig?.enabled && openaiConfig?.apiKey;
  
  if (!isEnabled) {
    return (
      <div className="chat-disabled">
        <p>AI features are not available.</p>
        <p>Contact your administrator to enable OpenAI integration.</p>
      </div>
    );
  }
  
  const handleSend = async (prompt: string) => {
    try {
      const result = await openaiService.generateComponent(
        prompt,
        conductor.config
      );
      // ... handle result
    } catch (error) {
      setError(error.message);
    }
  };
  
  return (
    <div className="chat-window">
      {/* Chat UI */}
    </div>
  );
}
```

## Security Benefits

### ✅ What This Fixes

1. **No Client-Side Storage:** API key never in localStorage/sessionStorage
2. **Host Control:** Admin controls access via environment variable
3. **Easy Rotation:** Change `OPENAI_API_KEY` in host env, restart app
4. **Audit Trail:** Server can log all OpenAI usage
5. **Rate Limiting:** Host can control request rate
6. **Cost Control:** Host can monitor and cap spending
7. **Team Access:** Single organization key, not individual keys

### ⚠️ Remaining Concerns (All Approaches Have This)

**Client-Side API Calls:**
Even with conductor config, if the plugin makes API calls directly from the browser:
- Key is in browser memory (can be intercepted)
- DevTools can see network requests
- Malicious code could extract key

**Solution:** Use **Server-Side Proxy** (Phase 2)

## Migration Path

### Week 1-2: Runtime Config (Quick Win)
```typescript
// In host repo
const conductor = new Conductor({
  plugins: {
    library: {
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4-turbo-preview',
        enabled: !!process.env.OPENAI_API_KEY
      }
    }
  }
});
```

**Effort:** 1-2 days to implement in both host and plugin

### Week 3-4: Server Proxy (Full Security)
```typescript
// In host repo - add API endpoint
app.post('/api/ai/generate-component', authenticateUser, async (req, res) => {
  // Server-side OpenAI call
  // Rate limiting
  // Usage logging
  // Error handling
});

// In plugin - call host endpoint
const response = await fetch('/api/ai/generate-component', {
  method: 'POST',
  body: JSON.stringify({ prompt, context })
});
```

**Effort:** 1 week to implement endpoint + plugin integration

## Updated GitHub Issue Sections

### Security (REVISED)

~~**Option A: Backend Proxy (Most Secure)**~~
~~**Option B: Session Storage (Better)**~~
~~**Option C: localStorage (Current Proposal)**~~

**✅ Implemented Approach: Conductor Config with Server Proxy Option**

**Phase 1: Runtime Config via Conductor (MVP)**
- Host passes `OPENAI_API_KEY` from environment variable
- Plugin accesses via `conductor.config`
- No user-provided API keys
- No localStorage/sessionStorage
- Significantly more secure than client-side storage

**Phase 2: Server-Side Proxy (Production)**
- Plugin makes requests to host endpoint
- Host server proxies to OpenAI
- API key never sent to client
- Full server-side control

### API Key Configuration (REVISED)

~~`src/ui/ApiKeySettings.tsx` - Settings panel for user API keys~~

**Removed:** No user-provided API keys

**Added:** `src/ui/OpenAIStatus.tsx` - Shows if AI features are enabled

```typescript
interface OpenAIStatusProps {}

export function OpenAIStatus() {
  const conductor = useConductor();
  const config = conductor?.config?.plugins?.library?.openai;
  
  return (
    <div className={`openai-status ${config?.enabled ? 'enabled' : 'disabled'}`}>
      {config?.enabled ? (
        <>
          <span className="icon">✅</span>
          <span>AI Generation Enabled</span>
          <span className="model">{config.model}</span>
        </>
      ) : (
        <>
          <span className="icon">❌</span>
          <span>AI features disabled</span>
          <small>Contact your administrator</small>
        </>
      )}
    </div>
  );
}
```

## Host Integration Guide

### For Host Developers

#### 1. Set Environment Variable
```bash
# .env or environment configuration
OPENAI_API_KEY=sk-proj-...your-key-here...
```

#### 2. Pass to Conductor
```typescript
// In your host app initialization
import { Conductor } from '@renderx-plugins/host-sdk';

const conductor = new Conductor({
  plugins: {
    library: {
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        enabled: !!process.env.OPENAI_API_KEY,
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000')
      }
    }
  }
});
```

#### 3. Optional: Add Server Endpoint (Phase 2)
```typescript
// Express.js example
app.post('/api/ai/generate-component', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: getSystemPrompt() },
          ...context,
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000
      })
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Summary

### Before (Original Proposal)
❌ Users enter their own API keys  
❌ Keys stored in localStorage (insecure)  
❌ XSS vulnerability risk  
❌ Users responsible for costs  
❌ No centralized control  

### After (Revised with Conductor Config)
✅ Host provides API key from environment  
✅ No client-side storage  
✅ Centralized administration  
✅ Organization pays costs  
✅ Easy to enable/disable  
✅ Path to full server-side proxy  

### Effort Comparison

| Approach | Security | Effort | When |
|----------|----------|--------|------|
| localStorage | ⭐ | 2 days | ❌ Not recommended |
| Conductor Config | ⭐⭐⭐⭐ | 2 days | ✅ Phase 1 (MVP) |
| Server Proxy | ⭐⭐⭐⭐⭐ | 1 week | ✅ Phase 2 (Production) |

## Next Steps

1. ✅ Confirm host can pass config via conductor
2. ✅ Remove `ApiKeySettings.tsx` from design
3. ✅ Add `OpenAIStatus.tsx` to show system status
4. ✅ Update `openai.service.ts` to accept conductor config
5. ✅ Update `ChatWindow.tsx` to use conductor config
6. ✅ Document host integration requirements
7. ✅ Plan Phase 2 server proxy (optional but recommended)

**This is a much cleaner and more secure architecture!** 🎉
