// lib/ai/orchestrator/provider-manager.ts

import { AIProvider } from '../types/provider';

export class ProviderManager {
  private providers: AIProvider[] = [];
  private activeProviderIndex = 0;

  constructor() {
    // TODO: Load providers dynamically
  }

  public getActiveProvider(): AIProvider {
    // TODO: Add failover logic
    return this.providers[this.activeProviderIndex];
  }

  public registerProvider(provider: AIProvider) {
    this.providers.push(provider);
  }
}
