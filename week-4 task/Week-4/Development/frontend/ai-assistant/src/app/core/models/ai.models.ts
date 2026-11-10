import { SafeHtml } from '@angular/platform-browser';

export interface ChatUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatResponseData {
  provider: string;
  model: string;
  reply: string;
  usage: ChatUsage;
}

export interface ChatResponse {
  success: boolean;
  data: ChatResponseData;
  user_id: string;
}

export interface ChatRequest {
  prompt: string;
  system_message?: string;
  provider?: string;
}

export interface ProviderDetail {
  name: string;
  default_model: string;
  base_url: string;
  is_configured: boolean;
}

export interface ProviderInfoResponse {
  active_provider: string;
  active_model: string;
  providers: {
    [key: string]: ProviderDetail;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  renderedHtml?: SafeHtml;
  timestamp: Date;
  provider?: string;
  model?: string;
  usage?: ChatUsage;
  isError?: boolean;
  feedback?: 'up' | 'down' | null;
  parentUserPrompt?: string;
}
