import { AudioSource } from './AudioSource';

export class AACSource extends AudioSource {
  constructor(
    id: string,
    name: string,
    sampleRate: number,
    channels: number,
    bufferSize: number
  ) {
    super(id, name, 'aac', sampleRate, channels, bufferSize);
  }

  async connect(): Promise<void> {
    console.log('Connecting to AAC source...');
  }

  async disconnect(): Promise<void> {
    console.log('Disconnecting from AAC source...');
  }

  async play(): Promise<void> {
    console.log('Playing AAC source...');
    this.status = 'playing';
  }

  async pause(): Promise<void> {
    console.log('Pausing AAC source...');
    this.status = 'paused';
  }

  async stop(): Promise<void> {
    console.log('Stopping AAC source...');
    this.status = 'stopped';
  }
}
