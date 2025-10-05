/**
 * AI Chat Window Component
 * Main chat interface for AI-powered component generation
 */

import React, { useState, useEffect, useRef } from 'react';
import { OpenAIService } from '../services/openai.service';
import { ChatMessage, ComponentJSON, ChatWindowProps } from '../services/openai.types';
import { ChatMessageComponent } from './ChatMessage';
import { ConfigStatusUI } from './ConfigStatusUI';
import {
  getCurrentChatSession,
  addMessagesToCurrentSession,
  clearAllChatHistory,
  getConversationContext,
  startNewChatSession
} from '../utils/chat.utils';
import './ChatWindow.css';

export function ChatWindow({ isOpen, onClose, onComponentGenerated }: ChatWindowProps) {
  const [openaiService] = useState(() => new OpenAIService());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const configStatus = openaiService.getConfigStatus();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && configStatus.configured) {
      inputRef.current?.focus();
    }
  }, [isOpen, configStatus.configured]);

  // Load chat history from current session
  useEffect(() => {
    if (configStatus.configured) {
      loadCurrentSession();
    }
  }, [configStatus.configured]);

  // Save messages to current session when they change
  useEffect(() => {
    if (messages.length > 0) {
      addMessagesToCurrentSession(messages);
    }
  }, [messages]);

  const loadCurrentSession = () => {
    try {
      const currentSession = getCurrentChatSession();
      if (currentSession && currentSession.messages.length > 0) {
        setMessages(currentSession.messages);
      }
    } catch (error) {
      console.warn('Failed to load current chat session:', error);
    }
  };

  const clearChatHistory = () => {
    setMessages([]);
    clearAllChatHistory();
  };

  const startNewChat = () => {
    setMessages([]);
    startNewChatSession();
  };

  const handleSendMessage = async () => {
    const prompt = inputValue.trim();
    if (!prompt || loading) return;

    setInputValue('');
    setError(null);
    setLoading(true);

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Generate component with conversation context
      const context = getConversationContext(4); // Get recent context
      const result = await openaiService.generateComponent({
        prompt,
        context
      });

      // Add AI response
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: result.explanation,
        timestamp: Date.now(),
        component: result.component
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: error.message || 'Sorry, I encountered an error while generating the component. Please try again.',
        timestamp: Date.now(),
        error: true
      };

      setMessages(prev => [...prev, errorMessage]);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAddToLibrary = (component: ComponentJSON) => {
    onComponentGenerated(component);
  };

  const handleRegenerateComponent = async (originalPrompt: string) => {
    setError(null);
    setLoading(true);

    try {
      const context = getConversationContext(2); // Get recent context for regeneration
      const result = await openaiService.generateComponent({
        prompt: `Please regenerate this component with improvements: ${originalPrompt}`,
        context
      });

      const aiMessage: ChatMessage = {
        id: `ai-regen-${Date.now()}`,
        role: 'assistant',
        content: `Here's an improved version: ${result.explanation}`,
        timestamp: Date.now(),
        component: result.component
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('Regeneration error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Show configuration UI if not configured
  if (!configStatus.configured) {
    return (
      <div className="chat-window">
        <div className="chat-header">
          <h3>🤖 AI Component Generator</h3>
          <button className="chat-close-button" onClick={onClose} title="Close">
            ✕
          </button>
        </div>
        <ConfigStatusUI status={configStatus} />
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>🤖 AI Component Generator</h3>
        <div className="chat-header-info">
          <span className="model-badge" title={`Using ${configStatus.model}`}>
            {configStatus.model?.replace('gpt-', 'GPT-') || 'GPT-4'}
          </span>
          <button
            className="clear-history-button"
            onClick={clearChatHistory}
            title="Clear chat history"
            disabled={messages.length === 0}
          >
            🗑️
          </button>
          <button
            className="new-chat-button"
            onClick={startNewChat}
            title="Start new chat"
          >
            ➕
          </button>
        </div>
        <button className="chat-close-button" onClick={onClose} title="Close">
          ✕
        </button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-welcome">
            <div className="welcome-icon">🎨</div>
            <h4>Welcome to AI Component Generator!</h4>
            <p>Describe a component you'd like to create and I'll generate it for you.</p>
            <div className="example-prompts">
              <p><strong>Try these examples:</strong></p>
              <ul>
                <li>"Create a blue button with rounded corners"</li>
                <li>"Make a card component with a title and description"</li>
                <li>"Design a loading spinner with animation"</li>
              </ul>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessageComponent
            key={message.id}
            message={message}
            onAddToLibrary={handleAddToLibrary}
            onRegenerateComponent={handleRegenerateComponent}
          />
        ))}

        {loading && (
          <div className="chat-message ai-message loading">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <p>Generating component...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="chat-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          <button onClick={() => setError(null)} className="error-dismiss">✕</button>
        </div>
      )}

      <div className="chat-input">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe a component you'd like to create..."
          disabled={loading}
          className="chat-input-field"
        />
        <button
          onClick={handleSendMessage}
          disabled={loading || !inputValue.trim()}
          className="chat-send-button"
          title="Send message"
        >
          {loading ? '⏳' : '📤'}
        </button>
      </div>
    </div>
  );
}
