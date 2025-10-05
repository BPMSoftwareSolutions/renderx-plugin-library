/**
 * TypeScript interfaces for OpenAI API integration and AI chat functionality
 */

// OpenAI API Types
export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAICompletionRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface OpenAICompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: OpenAIMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Chat Interface Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  component?: ComponentJSON;
  error?: boolean;
}

export interface ChatHistory {
  id: string;
  title: string;
  messages: ChatMessage[];
  created: number;
  updated: number;
}

// Component Generation Types
export interface ComponentJSON {
  metadata: {
    type: string;
    name: string;
    category: string;
    description: string;
    version: string;
    author: string;
    tags: string[];
  };
  ui: {
    template: string;
    styles: {
      css: string;
      variables: Record<string, any>;
      library: {
        css: string;
        variables: Record<string, any>;
      };
    };
    icon: {
      mode: 'emoji' | 'svg' | 'image';
      value: string;
    };
  };
}

export interface GenerateComponentRequest {
  prompt: string;
  context?: ChatMessage[];
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
}

export interface GenerateComponentResponse {
  component: ComponentJSON;
  explanation: string;
  suggestions?: string[];
}

// Configuration Types
export interface ConfigStatus {
  configured: boolean;
  message: string;
  instructions?: string;
  model?: string;
  action?: 'contact_admin' | 'setup_key' | null;
}

export interface AIProvider {
  id: string;
  name: string;
  models: string[];
  configured: boolean;
}

// Error Types
export interface OpenAIError {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string;
  };
}

export interface ChatError {
  type: 'api_error' | 'validation_error' | 'config_error' | 'network_error';
  message: string;
  details?: any;
}

// Generation Options
export interface GenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  includeContext?: boolean;
  validateOutput?: boolean;
}

// Chat Window Props
export interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onComponentGenerated: (component: ComponentJSON) => void;
}

export interface ChatMessageProps {
  message: ChatMessage;
  onAddToLibrary?: (component: ComponentJSON) => void;
  onEditComponent?: (component: ComponentJSON) => void;
  onCopyJSON?: (component: ComponentJSON) => void;
  onRegenerateComponent?: (originalPrompt: string) => void;
}

// System Prompt Types
export interface SystemPromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables?: Record<string, string>;
}

export interface PromptContext {
  componentSchema: string;
  examples: ComponentJSON[];
  guidelines: string[];
  constraints: string[];
}
