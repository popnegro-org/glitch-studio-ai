import { AudioSource } from './AudioSource';

export class ExternalAPISource extends AudioSource {
  constructor(
    id: string,
    name: string,
    sampleRate: number,
    channels: number,
    bufferSize: number,
    private apiUrl: string
  ) {
    super(id, name, 'external-api', sampleRate, channels, bufferSize);
  }

  async connect(): Promise<void> {
    console.log(`Connecting to external API source at ${this.apiUrl}...`);
  }

  async disconnect(): Promise<void> {
    console.log('Disconnecting from external API source...');
  }

  async play(): Promise<void> {
    console.log('Playing external API source...');
    this.status = 'playing';
  }

  async pause(): Promise<void> {
    console.log('Pausing external API source...');
    this.status = 'paused';
  }

  async stop(): Promise<void> {
    console.log('Stopping external API source...');
    this.status = 'stopped';
  }
}
