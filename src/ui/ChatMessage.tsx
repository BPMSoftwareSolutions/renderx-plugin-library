/**
 * Chat Message Component
 * Individual message component with user/AI differentiation and action buttons
 */

import React, { useState } from 'react';
import { ChatMessageProps, ComponentJSON } from '../services/openai.types';
import './ChatMessage.css';

export function ChatMessageComponent({ 
  message, 
  onAddToLibrary, 
  onEditComponent,
  onCopyJSON,
  onRegenerateComponent 
}: ChatMessageProps) {
  const [showJSON, setShowJSON] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleCopyJSON = async (component: ComponentJSON) => {
    try {
      const jsonString = JSON.stringify(component, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      if (onCopyJSON) {
        onCopyJSON(component);
      }
    } catch (error) {
      console.error('Failed to copy JSON:', error);
    }
  };

  const handleAddToLibrary = () => {
    if (message.component && onAddToLibrary) {
      onAddToLibrary(message.component);
    }
  };

  const handleEditComponent = () => {
    if (message.component && onEditComponent) {
      onEditComponent(message.component);
    }
  };

  const handleRegenerate = () => {
    if (onRegenerateComponent) {
      // Try to extract the original prompt from the conversation
      const prompt = message.content.includes('based on your request:') 
        ? message.content.split('based on your request:')[1]?.replace(/['"]/g, '').trim()
        : 'Regenerate this component with improvements';
      
      onRegenerateComponent(prompt);
    }
  };

  const renderComponentPreview = (component: ComponentJSON) => {
    return (
      <div className="component-preview">
        <div className="component-header">
          <div className="component-info">
            <span className="component-icon">
              {component.ui.icon?.value || '🧩'}
            </span>
            <div className="component-details">
              <h4 className="component-name">{component.metadata.name}</h4>
              <p className="component-description">{component.metadata.description}</p>
              <div className="component-tags">
                {component.metadata.tags?.map((tag, index) => (
                  <span key={index} className="component-tag">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="component-actions">
          <button 
            className="action-button primary"
            onClick={handleAddToLibrary}
            title="Add to Component Library"
          >
            ➕ Add to Library
          </button>
          
          <button 
            className="action-button secondary"
            onClick={() => setShowJSON(!showJSON)}
            title="View/Hide JSON"
          >
            {showJSON ? '👁️ Hide JSON' : '📄 View JSON'}
          </button>
          
          <button 
            className="action-button secondary"
            onClick={() => handleCopyJSON(component)}
            title="Copy JSON to clipboard"
          >
            {copied ? '✅ Copied!' : '📋 Copy JSON'}
          </button>
          
          {onEditComponent && (
            <button 
              className="action-button secondary"
              onClick={handleEditComponent}
              title="Edit component"
            >
              ✏️ Edit
            </button>
          )}
          
          <button 
            className="action-button secondary"
            onClick={handleRegenerate}
            title="Generate a new version"
          >
            🔄 Try Again
          </button>
        </div>

        {showJSON && (
          <div className="component-json">
            <div className="json-header">
              <span>Component JSON</span>
              <button 
                className="json-close"
                onClick={() => setShowJSON(false)}
                title="Hide JSON"
              >
                ✕
              </button>
            </div>
            <pre className="json-content">
              <code>{JSON.stringify(component, null, 2)}</code>
            </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`chat-message ${message.role}-message ${message.error ? 'error-message' : ''}`}>
      <div className="message-avatar">
        {message.role === 'user' ? '👤' : message.error ? '❌' : '🤖'}
      </div>
      
      <div className="message-content">
        <div className="message-header">
          <span className="message-role">
            {message.role === 'user' ? 'You' : message.error ? 'Error' : 'AI Assistant'}
          </span>
          <span className="message-timestamp">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
        
        <div className="message-text">
          {message.content}
        </div>
        
        {message.component && !message.error && (
          renderComponentPreview(message.component)
        )}
      </div>
    </div>
  );
}
