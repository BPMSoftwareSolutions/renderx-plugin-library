/**
 * Unit tests for Chat Utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  loadChatHistory,
  saveChatHistory,
  createChatSession,
  addMessagesToCurrentSession,
  getCurrentChatSession,
  startNewChatSession,
  deleteChatSession,
  clearAllChatHistory,
  getChatHistoryStats,
  getConversationContext
} from '../src/utils/chat.utils';
import { ChatMessage, ChatHistory } from '../src/services/openai.types';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Chat Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockMessage = (role: 'user' | 'assistant', content: string): ChatMessage => ({
    id: `msg-${Date.now()}-${Math.random()}`,
    role,
    content,
    timestamp: Date.now()
  });

  const createMockSession = (messages: ChatMessage[] = []): ChatHistory => ({
    id: `chat-${Date.now()}`,
    title: 'Test Chat',
    messages,
    created: Date.now(),
    updated: Date.now()
  });

  describe('loadChatHistory', () => {
    it('should return empty array when no history exists', () => {
      const history = loadChatHistory();
      expect(history).toEqual([]);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('renderx:ai-chat-history');
    });

    it('should load existing chat history', () => {
      const mockHistory = [createMockSession()];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory));

      const history = loadChatHistory();
      expect(history).toEqual(mockHistory);
    });

    it('should handle corrupted localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      const history = loadChatHistory();
      expect(history).toEqual([]);
    });

    it('should handle non-array data', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({ not: 'array' }));
      
      const history = loadChatHistory();
      expect(history).toEqual([]);
    });
  });

  describe('saveChatHistory', () => {
    it('should save chat history to localStorage', () => {
      const mockHistory = [createMockSession()];
      
      const result = saveChatHistory(mockHistory);
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'renderx:ai-chat-history',
        JSON.stringify(mockHistory)
      );
    });

    it('should limit number of sessions', () => {
      const mockHistory = Array.from({ length: 15 }, () => createMockSession());
      
      saveChatHistory(mockHistory);
      
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(10); // MAX_HISTORY_SESSIONS
    });

    it('should limit messages per session', () => {
      const messages = Array.from({ length: 60 }, (_, i) => 
        createMockMessage('user', `Message ${i}`)
      );
      const session = createMockSession(messages);
      
      saveChatHistory([session]);
      
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData[0].messages).toHaveLength(50); // MAX_MESSAGES_PER_SESSION
    });

    it('should handle localStorage errors', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      const result = saveChatHistory([createMockSession()]);
      expect(result).toBe(false);
    });
  });

  describe('createChatSession', () => {
    it('should create a new chat session with default title', () => {
      const session = createChatSession();
      
      expect(session.id).toMatch(/^chat-\d+-[a-z0-9]+$/);
      expect(session.title).toBe('New Chat');
      expect(session.messages).toEqual([]);
      expect(session.created).toBeTypeOf('number');
      expect(session.updated).toBeTypeOf('number');
    });

    it('should create a chat session with messages and generated title', () => {
      const messages = [createMockMessage('user', 'Create a button component')];
      const session = createChatSession(messages);
      
      expect(session.title).toBe('Create a button component');
      expect(session.messages).toEqual(messages);
    });

    it('should truncate long titles', () => {
      const longMessage = 'A'.repeat(60);
      const messages = [createMockMessage('user', longMessage)];
      const session = createChatSession(messages);
      
      expect(session.title).toHaveLength(53); // 50 chars + '...'
      expect(session.title).toEndWith('...');
    });
  });

  describe('addMessagesToCurrentSession', () => {
    it('should create new session if none exists', () => {
      const messages = [createMockMessage('user', 'Hello')];
      
      const result = addMessagesToCurrentSession(messages);
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should add messages to existing session', () => {
      const existingSession = createMockSession([
        createMockMessage('user', 'First message')
      ]);
      localStorageMock.getItem.mockReturnValue(JSON.stringify([existingSession]));
      
      const newMessages = [createMockMessage('assistant', 'Response')];
      const result = addMessagesToCurrentSession(newMessages);
      
      expect(result).toBe(true);
      
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData[0].messages).toHaveLength(2);
    });

    it('should update session title if still default', () => {
      const existingSession = createMockSession();
      existingSession.title = 'New Chat';
      localStorageMock.getItem.mockReturnValue(JSON.stringify([existingSession]));
      
      const newMessages = [createMockMessage('user', 'Create a card component')];
      addMessagesToCurrentSession(newMessages);
      
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData[0].title).toBe('Create a card component');
    });
  });

  describe('getCurrentChatSession', () => {
    it('should return null when no sessions exist', () => {
      const session = getCurrentChatSession();
      expect(session).toBe(null);
    });

    it('should return the most recent session', () => {
      const sessions = [
        { ...createMockSession(), updated: 1000 },
        { ...createMockSession(), updated: 2000 },
        { ...createMockSession(), updated: 1500 }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(sessions));
      
      const session = getCurrentChatSession();
      expect(session?.updated).toBe(1500); // Last in array
    });
  });

  describe('deleteChatSession', () => {
    it('should delete session by ID', () => {
      const sessions = [
        { ...createMockSession(), id: 'session-1' },
        { ...createMockSession(), id: 'session-2' },
        { ...createMockSession(), id: 'session-3' }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(sessions));
      
      const result = deleteChatSession('session-2');
      
      expect(result).toBe(true);
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(2);
      expect(savedData.find((s: any) => s.id === 'session-2')).toBeUndefined();
    });

    it('should return false if session not found', () => {
      const sessions = [{ ...createMockSession(), id: 'session-1' }];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(sessions));
      
      const result = deleteChatSession('nonexistent');
      
      expect(result).toBe(false);
    });
  });

  describe('clearAllChatHistory', () => {
    it('should clear all chat history', () => {
      const result = clearAllChatHistory();
      
      expect(result).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('renderx:ai-chat-history');
    });
  });

  describe('getChatHistoryStats', () => {
    it('should return stats for empty history', () => {
      const stats = getChatHistoryStats();
      
      expect(stats.sessionCount).toBe(0);
      expect(stats.totalMessages).toBe(0);
      expect(stats.storageSizeKB).toBe(0);
      expect(stats.oldestSession).toBeUndefined();
      expect(stats.newestSession).toBeUndefined();
    });

    it('should calculate stats correctly', () => {
      const sessions = [
        {
          ...createMockSession([
            createMockMessage('user', 'Hello'),
            createMockMessage('assistant', 'Hi')
          ]),
          created: 1000
        },
        {
          ...createMockSession([
            createMockMessage('user', 'Goodbye')
          ]),
          created: 2000
        }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(sessions));
      
      const stats = getChatHistoryStats();
      
      expect(stats.sessionCount).toBe(2);
      expect(stats.totalMessages).toBe(3);
      expect(stats.oldestSession).toEqual(new Date(1000));
      expect(stats.newestSession).toEqual(new Date(2000));
    });
  });

  describe('getConversationContext', () => {
    it('should return empty array when no current session', () => {
      const context = getConversationContext();
      expect(context).toEqual([]);
    });

    it('should return recent messages excluding errors', () => {
      const messages = [
        createMockMessage('user', 'Message 1'),
        createMockMessage('assistant', 'Response 1'),
        { ...createMockMessage('assistant', 'Error'), error: true },
        createMockMessage('user', 'Message 2'),
        createMockMessage('assistant', 'Response 2')
      ];
      const session = createMockSession(messages);
      localStorageMock.getItem.mockReturnValue(JSON.stringify([session]));
      
      const context = getConversationContext(3);
      
      expect(context).toHaveLength(3);
      expect(context.find(msg => msg.error)).toBeUndefined();
    });
  });
});
