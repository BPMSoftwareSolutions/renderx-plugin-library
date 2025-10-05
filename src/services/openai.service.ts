/**
 * OpenAI Service for AI-powered component generation
 * Uses Host SDK Config Service for secure API key management
 */

import { getConfigValue, hasConfigValue } from '@renderx-plugins/host-sdk';
import {
  OpenAIMessage,
  OpenAICompletionRequest,
  OpenAICompletionResponse,
  OpenAIError,
  ChatMessage,
  ComponentJSON,
  GenerateComponentRequest,
  GenerateComponentResponse,
  ConfigStatus,
  ChatError,
  GenerationOptions as _GenerationOptions
} from './openai.types';
import { buildSystemPrompt, EXAMPLE_COMPONENTS } from '../utils/prompt.templates';
import { validateComponentJson } from '../utils/validation.utils';

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
        instructions: 'Contact your administrator to enable AI features',
        action: 'contact_admin'
      };
    }

    return {
      configured: true,
      model: this.model,
      message: 'AI Component Generation Ready',
      action: null
    };
  }

  /**
   * Generate component from natural language prompt
   */
  async generateComponent(request: GenerateComponentRequest): Promise<GenerateComponentResponse> {
    if (!this.apiKey) {
      throw new ChatError({
        type: 'config_error',
        message: 'OpenAI API key not configured. Please contact your administrator.',
        details: { action: 'contact_admin' }
      });
    }

    try {
      const messages = this.buildMessages(request.prompt, request.context);
      const options = request.options || {};

      const response = await this.callOpenAI({
        model: options.model || this.model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000
      });

      return this.parseComponentResponse(response, request.prompt);
    } catch (error) {
      console.error('OpenAI generation failed:', error);
      
      if (error instanceof ChatError) {
        throw error;
      }

      // Handle OpenAI API errors
      if (this.isOpenAIError(error)) {
        throw new ChatError({
          type: 'api_error',
          message: `OpenAI API error: ${error.error.message}`,
          details: error.error
        });
      }

      // Handle network errors
      throw new ChatError({
        type: 'network_error',
        message: 'Failed to generate component. Please try again.',
        details: error
      });
    }
  }

  /**
   * Build message array for OpenAI API
   */
  private buildMessages(prompt: string, context?: ChatMessage[]): OpenAIMessage[] {
    const messages: OpenAIMessage[] = [
      { role: 'system', content: this.getSystemPrompt() }
    ];

    // Add conversation context if provided
    if (context && context.length > 0) {
      // Only include the last few messages to stay within token limits
      const recentContext = context.slice(-4);
      for (const msg of recentContext) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      }
    }

    // Add current user prompt
    messages.push({ role: 'user', content: prompt });

    return messages;
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(request: OpenAICompletionRequest): Promise<OpenAICompletionResponse> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    const data = await response.json();

    if (!response.ok) {
      throw data as OpenAIError;
    }

    return data as OpenAICompletionResponse;
  }

  /**
   * Parse OpenAI response and extract component JSON
   */
  private parseComponentResponse(response: OpenAICompletionResponse, originalPrompt: string): GenerateComponentResponse {
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new ChatError({
        type: 'api_error',
        message: 'Empty response from OpenAI',
        details: response
      });
    }

    try {
      // Extract JSON from response (might be in markdown code block)
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || 
                       content.match(/(\{[\s\S]*\})/);
      
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const componentJSON = JSON.parse(jsonMatch[1]) as ComponentJSON;
      
      // Validate the component structure
      this.validateComponent(componentJSON);

      // Extract explanation (text before or after JSON)
      const explanation = content.replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/, '').trim() ||
                         `Generated component "${componentJSON.metadata.name}" based on your request: "${originalPrompt}"`;

      return {
        component: componentJSON,
        explanation,
        suggestions: this.generateSuggestions(componentJSON)
      };
    } catch (error) {
      throw new ChatError({
        type: 'validation_error',
        message: `Failed to parse component JSON: ${error.message}`,
        details: { content, error }
      });
    }
  }

  /**
   * Validate component JSON structure using existing validation utils
   */
  private validateComponent(component: ComponentJSON): void {
    const validation = validateComponentJson(component);

    if (!validation.isValid) {
      throw new Error(`Component validation failed: ${validation.errors.join(', ')}`);
    }

    // Ensure category is 'custom' for generated components
    component.metadata.category = 'custom';
    component.metadata.author = 'AI Generated';
    component.metadata.version = component.metadata.version || '1.0.0';

    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.warn('Component validation warnings:', validation.warnings);
    }
  }

  /**
   * Generate suggestions for component improvements
   */
  private generateSuggestions(component: ComponentJSON): string[] {
    const suggestions: string[] = [];
    
    if (!component.ui.styles?.css) {
      suggestions.push('Add custom CSS styling');
    }
    
    if (!component.metadata.tags?.length) {
      suggestions.push('Add descriptive tags');
    }
    
    if (!component.ui.icon) {
      suggestions.push('Add an icon for better visual identification');
    }

    return suggestions;
  }

  /**
   * Get system prompt for component generation
   */
  private getSystemPrompt(): string {
    return buildSystemPrompt({
      componentSchema: 'RenderX Component Schema',
      examples: EXAMPLE_COMPONENTS.slice(0, 1), // Include one example to avoid token limits
      guidelines: [
        'Focus on creating reusable, accessible components',
        'Use semantic HTML elements',
        'Include proper ARIA attributes where needed',
        'Ensure components work in both light and dark themes'
      ],
      constraints: [
        'No external dependencies or imports',
        'No JavaScript code in templates',
        'Keep CSS concise but comprehensive',
        'Use only standard web technologies'
      ]
    });
  }

  /**
   * Check if error is from OpenAI API
   */
  private isOpenAIError(error: any): error is OpenAIError {
    return error && error.error && typeof error.error.message === 'string';
  }
}

/**
 * Custom error class for chat-related errors
 */
class ChatError extends Error {
  public type: ChatError['type'];
  public details?: any;

  constructor(error: ChatError) {
    super(error.message);
    this.name = 'ChatError';
    this.type = error.type;
    this.details = error.details;
  }
}

export { ChatError };
