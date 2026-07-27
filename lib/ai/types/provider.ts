// lib/ai/types/provider.ts

export interface AIProvider {
  name: string;

  initialize(): Promise<void>;
  health(): Promise<'ok' | 'error'>;

  generateText(prompt: string, options?: any): Promise<string>;
  generateJSON(prompt: string, options?: any): Promise<any>;
  stream(prompt: string, options?: any): AsyncGenerator<string>;
  chat(messages: any[], options?: any): Promise<any>;
  embeddings(text: string, options?: any): Promise<number[]>;
  vision(image: Buffer, options?: any): Promise<any>;
  toolCalling(prompt: string, tools: any[], options?: any): Promise<any>;

  dispose(): Promise<void>;
}
