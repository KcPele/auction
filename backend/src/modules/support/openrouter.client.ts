import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  role: ChatRole;
  content: string;
  /** Function-calling identifier (assistant `tool_calls[].id`). */
  tool_call_id?: string;
  name?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  temperature?: number;
  max_tokens?: number;
  tool_choice?: 'auto' | 'none';
}

export interface ChatChoice {
  finish_reason: string;
  message: ChatMessage;
}

export interface ChatResponse {
  id: string;
  model: string;
  choices: ChatChoice[];
}

/**
 * Thin wrapper around OpenRouter's OpenAI-compatible chat/completions
 * endpoint. We only use the non-streaming path; the support flow is a
 * request → AI tool loop → final reply, which streams better via WS push
 * from the service than via HTTP SSE.
 */
@Injectable()
export class OpenRouterClient {
  private readonly logger = new Logger(OpenRouterClient.name);

  constructor(private readonly config: ConfigService) {}

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const apiKey = this.config.get<string>('OPENROUTER_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'OpenRouter is not configured (OPENROUTER_API_KEY missing)',
      );
    }
    const baseUrl = this.config.get<string>('OPENROUTER_BASE_URL');
    const appName = this.config.get<string>('OPENROUTER_APP_NAME');
    const appUrl = this.config.get<string>('OPENROUTER_APP_URL');

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
        // OpenRouter likes the referer + title so requests show up in the
        // merchant's dashboard correctly.
        ...(appUrl ? { 'http-referer': appUrl } : {}),
        ...(appName ? { 'x-title': appName } : {}),
      },
      body: JSON.stringify(request),
    });

    const text = await response.text();
    if (!response.ok) {
      this.logger.warn(
        `OpenRouter ${response.status}: ${text.slice(0, 300)}`,
      );
      throw new ServiceUnavailableException(
        `OpenRouter call failed (${response.status}). Try again shortly.`,
      );
    }

    try {
      return JSON.parse(text) as ChatResponse;
    } catch (err) {
      throw new ServiceUnavailableException(
        `OpenRouter returned non-JSON response: ${(err as Error).message}`,
      );
    }
  }
}
