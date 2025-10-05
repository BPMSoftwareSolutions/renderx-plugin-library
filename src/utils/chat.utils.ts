/**
 * Chat utilities for managing conversation history and context
 * Handles localStorage operations for chat history (NOT API keys)
 */

import { ChatMessage, ChatHistory } from '../services/openai.types';

const CHAT_HISTORY_KEY = 'renderx:ai-chat-history';
const MAX_HISTORY_SESSIONS = 10;
const MAX_MESSAGES_PER_SESSION = 50;

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Generate a title for a chat session based on the first message
 */
function generateChatTitle(messages: ChatMessage[]): string {
  const firstUserMessage = messages.find(msg => msg.role === 'user');
  if (firstUserMessage) {
    // Take first 50 characters and add ellipsis if longer
    const content = firstUserMessage.content.trim();
    return content.length > 50 ? `${content.substring(0, 50)}...` : content;
  }
  return `Chat ${new Date().toLocaleDateString()}`;
}

/**
 * Load all chat history from localStorage
 */
export function loadChatHistory(): ChatHistory[] {
  try {
    const data = localStorage.getItem(CHAT_HISTORY_KEY);
    if (!data) return [];
    
    const history = JSON.parse(data);
    return Array.isArray(history) ? history : [];
  } catch (error) {
    console.warn('Failed to load chat history:', error);
    return [];
  }
}

/**
 * Save chat history to localStorage
 */
export function saveChatHistory(history: ChatHistory[]): boolean {
  try {
    // Limit the number of sessions
    const limitedHistory = history.slice(-MAX_HISTORY_SESSIONS);
    
    // Limit messages per session
    const processedHistory = limitedHistory.map(session => ({
      ...session,
      messages: session.messages.slice(-MAX_MESSAGES_PER_SESSION)
    }));
    
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(processedHistory));
    return true;
  } catch (error) {
    console.warn('Failed to save chat history:', error);
    return false;
  }
}

/**
 * Create a new chat session
 */
export function createChatSession(messages: ChatMessage[] = []): ChatHistory {
  return {
    id: generateSessionId(),
    title: messages.length > 0 ? generateChatTitle(messages) : 'New Chat',
    messages,
    created: Date.now(),
    updated: Date.now()
  };
}

/**
 * Add messages to current session and save
 */
export function addMessagesToCurrentSession(messages: ChatMessage[]): boolean {
  try {
    const history = loadChatHistory();
    
    if (history.length === 0) {
      // Create new session
      const newSession = createChatSession(messages);
      return saveChatHistory([newSession]);
    }
    
    // Update the most recent session
    const currentSession = history[history.length - 1];
    currentSession.messages = [...currentSession.messages, ...messages];
    currentSession.updated = Date.now();
    
    // Update title if it's still the default
    if (currentSession.title === 'New Chat' && messages.length > 0) {
      currentSession.title = generateChatTitle(currentSession.messages);
    }
    
    return saveChatHistory(history);
  } catch (error) {
    console.warn('Failed to add messages to session:', error);
    return false;
  }
}

/**
 * Get the current (most recent) chat session
 */
export function getCurrentChatSession(): ChatHistory | null {
  const history = loadChatHistory();
  return history.length > 0 ? history[history.length - 1] : null;
}

/**
 * Start a new chat session
 */
export function startNewChatSession(): ChatHistory {
  const newSession = createChatSession();
  const history = loadChatHistory();
  saveChatHistory([...history, newSession]);
  return newSession;
}

/**
 * Delete a chat session by ID
 */
export function deleteChatSession(sessionId: string): boolean {
  try {
    const history = loadChatHistory();
    const filteredHistory = history.filter(session => session.id !== sessionId);
    
    if (filteredHistory.length === history.length) {
      return false; // Session not found
    }
    
    return saveChatHistory(filteredHistory);
  } catch (error) {
    console.warn('Failed to delete chat session:', error);
    return false;
  }
}

/**
 * Clear all chat history
 */
export function clearAllChatHistory(): boolean {
  try {
    localStorage.removeItem(CHAT_HISTORY_KEY);
    return true;
  } catch (error) {
    console.warn('Failed to clear chat history:', error);
    return false;
  }
}

/**
 * Get chat history statistics
 */
export function getChatHistoryStats(): {
  sessionCount: number;
  totalMessages: number;
  oldestSession?: Date;
  newestSession?: Date;
  storageSizeKB: number;
} {
  const history = loadChatHistory();
  const totalMessages = history.reduce((sum, session) => sum + session.messages.length, 0);
  
  let storageSizeKB = 0;
  try {
    const data = localStorage.getItem(CHAT_HISTORY_KEY);
    if (data) {
      storageSizeKB = Math.round(new Blob([data]).size / 1024);
    }
  } catch {
    // Ignore errors
  }
  
  const stats = {
    sessionCount: history.length,
    totalMessages,
    storageSizeKB
  };
  
  if (history.length > 0) {
    const dates = history.map(s => new Date(s.created)).sort((a, b) => a.getTime() - b.getTime());
    return {
      ...stats,
      oldestSession: dates[0],
      newestSession: dates[dates.length - 1]
    };
  }
  
  return stats;
}

/**
 * Export chat history as JSON
 */
export function exportChatHistory(): string {
  const history = loadChatHistory();
  return JSON.stringify(history, null, 2);
}

/**
 * Import chat history from JSON
 */
export function importChatHistory(jsonData: string): { success: boolean; error?: string; imported?: number } {
  try {
    const importedHistory = JSON.parse(jsonData);
    
    if (!Array.isArray(importedHistory)) {
      return { success: false, error: 'Invalid format: expected array of chat sessions' };
    }
    
    // Validate structure
    for (const session of importedHistory) {
      if (!session.id || !session.messages || !Array.isArray(session.messages)) {
        return { success: false, error: 'Invalid session format' };
      }
    }
    
    // Merge with existing history
    const existingHistory = loadChatHistory();
    const mergedHistory = [...existingHistory, ...importedHistory];
    
    if (saveChatHistory(mergedHistory)) {
      return { success: true, imported: importedHistory.length };
    } else {
      return { success: false, error: 'Failed to save imported history' };
    }
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Get conversation context for AI (recent messages)
 */
export function getConversationContext(maxMessages: number = 6): ChatMessage[] {
  const currentSession = getCurrentChatSession();
  if (!currentSession || currentSession.messages.length === 0) {
    return [];
  }
  
  // Return the most recent messages, excluding error messages
  return currentSession.messages
    .filter(msg => !msg.error)
    .slice(-maxMessages);
}

/**
 * Clean up old chat history (keep only recent sessions)
 */
export function cleanupChatHistory(maxSessions: number = MAX_HISTORY_SESSIONS): boolean {
  try {
    const history = loadChatHistory();
    if (history.length <= maxSessions) {
      return true; // Nothing to clean up
    }
    
    // Keep only the most recent sessions
    const recentHistory = history
      .sort((a, b) => b.updated - a.updated)
      .slice(0, maxSessions);
    
    return saveChatHistory(recentHistory);
  } catch (error) {
    console.warn('Failed to cleanup chat history:', error);
    return false;
  }
}
