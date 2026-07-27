import { AudioSource } from './AudioSource';

export class OGGSource extends AudioSource {
  constructor(
    id: string,
    name: string,
    sampleRate: number,
    channels: number,
    bufferSize: number
  ) {
    super(id, name, 'ogg', sampleRate, channels, bufferSize);
  }

  async connect(): Promise<void> {
    console.log('Connecting to OGG source...');
  }

  async disconnect(): Promise<void> {
    console.log('Disconnecting from OGG source...');
  }

  async play(): Promise<void> {
    console.log('Playing OGG source...');
    this.status = 'playing';
  }

  async pause(): Promise<void> {
    console.log('Pausing OGG source...');
    this.status = 'paused';
  }

  async stop(): Promise<void> {
    console.log('Stopping OGG source...');
    this.status = 'stopped';
  }
}
