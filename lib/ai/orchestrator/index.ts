// lib/ai/orchestrator/index.ts

import { ProviderManager } from './provider-manager';

class AIOrchestrator {
  private static instance: AIOrchestrator;
  private providerManager: ProviderManager;

  private constructor() {
    this.providerManager = new ProviderManager();
  }

  public static getInstance(): AIOrchestrator {
    if (!AIOrchestrator.instance) {
      AIOrchestrator.instance = new AIOrchestrator();
    }
    return AIOrchestrator.instance;
  }

  // Add methods that will be called from the frontend, e.g.:
  // public async generateText(prompt: string) {
  //   const provider = this.providerManager.getActiveProvider();
  //   return provider.generateText(prompt);
  // }
}

export const aiOrchestrator = AIOrchestrator.getInstance();
