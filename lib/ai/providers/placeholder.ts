// lib/ai/providers/placeholder.ts

import { AIProvider } from '../types/provider';

export class PlaceholderProvider implements AIProvider {
  name = 'placeholder';

  async initialize(): Promise<void> {
    console.log('PlaceholderProvider initialized');
  }

  async health(): Promise<'ok' | 'error'> {
    return 'ok';
  }

  async generateText(prompt: string, options?: any): Promise<string> {
    return `Placeholder response for: ${prompt}`;
  }

  async generateJSON(prompt: string, options?: any): Promise<any> {
    return { placeholder: `JSON response for: ${prompt}` };
  }

  async *stream(prompt: string, options?: any): AsyncGenerator<string> {
    yield `Placeholder stream response for: ${prompt}`;
  }

  async chat(messages: any[], options?: any): Promise<any> {
    return { placeholder: `Chat response` };
  }

  async embeddings(text: string, options?: any): Promise<number[]> {
    return [0.1, 0.2, 0.3];
  }

  async vision(image: Buffer, options?: any): Promise<any> {
    return { placeholder: 'Vision response' };
  }

  async toolCalling(prompt: string, tools: any[], options?: any): Promise<any> {
    return { placeholder: 'Tool calling response' };
  }

  async dispose(): Promise<void> {
    console.log('PlaceholderProvider disposed');
  }
}
