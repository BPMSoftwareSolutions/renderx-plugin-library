/**
 * Unit tests for OpenAI Service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAIService, ChatError } from '../src/services/openai.service';

// Mock the Host SDK
vi.mock('@renderx-plugins/host-sdk', () => ({
  getConfigValue: vi.fn(),
  hasConfigValue: vi.fn()
}));

// Mock fetch
global.fetch = vi.fn();

// Import mocked modules
import { getConfigValue, hasConfigValue } from '@renderx-plugins/host-sdk';

describe('OpenAIService', () => {
  const mockGetConfigValue = vi.mocked(getConfigValue);
  const mockHasConfigValue = vi.mocked(hasConfigValue);
  const mockFetch = vi.mocked(fetch);

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockGetConfigValue.mockImplementation((key: string) => {
      if (key === 'OPENAI_API_KEY') return 'sk-test-key-123';
      if (key === 'OPENAI_MODEL') return 'gpt-4-turbo-preview';
      return undefined;
    });
    
    mockHasConfigValue.mockImplementation((key: string) => {
      return key === 'OPENAI_API_KEY';
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Configuration Detection', () => {
    it('should detect when OpenAI is configured', () => {
      expect(OpenAIService.isConfigured()).toBe(true);
      expect(mockHasConfigValue).toHaveBeenCalledWith('OPENAI_API_KEY');
    });

    it('should detect when OpenAI is not configured', () => {
      mockHasConfigValue.mockReturnValue(false);
      expect(OpenAIService.isConfigured()).toBe(false);
    });

    it('should return proper config status when configured', () => {
      const service = new OpenAIService();
      const status = service.getConfigStatus();
      
      expect(status.configured).toBe(true);
      expect(status.model).toBe('gpt-4-turbo-preview');
      expect(status.message).toContain('Ready');
      expect(status.action).toBe(null);
    });

    it('should return proper config status when not configured', () => {
      mockGetConfigValue.mockReturnValue(undefined);
      mockHasConfigValue.mockReturnValue(false);
      
      const service = new OpenAIService();
      const status = service.getConfigStatus();
      
      expect(status.configured).toBe(false);
      expect(status.message).toContain('not configured');
      expect(status.action).toBe('contact_admin');
    });
  });

  describe('Component Generation', () => {
    it('should throw error when not configured', async () => {
      mockGetConfigValue.mockReturnValue(undefined);
      
      const service = new OpenAIService();
      
      await expect(service.generateComponent({
        prompt: 'Create a button'
      })).rejects.toThrow('OpenAI API key not configured');
    });

    it('should generate component successfully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: `Here's a button component:

\`\`\`json
{
  "metadata": {
    "type": "test-button",
    "name": "Test Button",
    "category": "custom",
    "description": "A test button",
    "version": "1.0.0",
    "author": "AI Generated",
    "tags": ["button"]
  },
  "ui": {
    "template": "<button>{{text}}</button>",
    "styles": {
      "css": ".test-button { padding: 8px; }",
      "variables": { "text": "Click me" },
      "library": { "css": "", "variables": {} }
    },
    "icon": { "mode": "emoji", "value": "🔘" }
  }
}
\`\`\`

This is a simple button component.`
          }
        }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response);

      const service = new OpenAIService();
      const result = await service.generateComponent({
        prompt: 'Create a button'
      });

      expect(result.component.metadata.type).toBe('test-button');
      expect(result.component.metadata.name).toBe('Test Button');
      expect(result.component.metadata.category).toBe('custom');
      expect(result.explanation).toContain('button component');
    });

    it('should handle OpenAI API errors', async () => {
      const mockError = {
        error: {
          message: 'Invalid API key',
          type: 'invalid_request_error'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(mockError)
      } as Response);

      const service = new OpenAIService();
      
      await expect(service.generateComponent({
        prompt: 'Create a button'
      })).rejects.toThrow('OpenAI API error: Invalid API key');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const service = new OpenAIService();
      
      await expect(service.generateComponent({
        prompt: 'Create a button'
      })).rejects.toThrow('Failed to generate component');
    });

    it('should handle invalid JSON responses', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'This is not valid JSON'
          }
        }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response);

      const service = new OpenAIService();
      
      await expect(service.generateComponent({
        prompt: 'Create a button'
      })).rejects.toThrow('Failed to parse component JSON');
    });

    it('should validate generated components', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: `\`\`\`json
{
  "metadata": {
    "type": "invalid-component"
  },
  "ui": {}
}
\`\`\``
          }
        }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response);

      const service = new OpenAIService();
      
      await expect(service.generateComponent({
        prompt: 'Create invalid component'
      })).rejects.toThrow('Component validation failed');
    });
  });

  describe('Message Building', () => {
    it('should build messages with system prompt', async () => {
      const service = new OpenAIService();
      
      // Mock a successful response to test message building
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: `\`\`\`json
{
  "metadata": {
    "type": "test-button",
    "name": "Test Button",
    "category": "custom",
    "description": "A test button",
    "version": "1.0.0",
    "author": "AI Generated",
    "tags": ["button"]
  },
  "ui": {
    "template": "<button>{{text}}</button>",
    "styles": {
      "css": ".test-button { padding: 8px; }",
      "variables": { "text": "Click me" },
      "library": { "css": "", "variables": {} }
    },
    "icon": { "mode": "emoji", "value": "🔘" }
  }
}
\`\`\``
            }
          }]
        })
      } as Response);

      await service.generateComponent({
        prompt: 'Create a button',
        context: [
          {
            id: '1',
            role: 'user',
            content: 'Previous message',
            timestamp: Date.now()
          }
        ]
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer sk-test-key-123',
            'Content-Type': 'application/json'
          },
          body: expect.stringContaining('"messages"')
        })
      );

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs?.body as string);
      
      expect(body.messages).toHaveLength(3); // system + context + user
      expect(body.messages[0].role).toBe('system');
      expect(body.messages[1].role).toBe('user');
      expect(body.messages[1].content).toBe('Previous message');
      expect(body.messages[2].role).toBe('user');
      expect(body.messages[2].content).toBe('Create a button');
    });
  });
});
