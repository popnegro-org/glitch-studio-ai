import { AudioSource } from './AudioSource';

export class WAVSource extends AudioSource {
  constructor(
    id: string,
    name: string,
    sampleRate: number,
    channels: number,
    bufferSize: number
  ) {
    super(id, name, 'wav', sampleRate, channels, bufferSize);
  }

  async connect(): Promise<void> {
    console.log('Connecting to WAV source...');
  }

  async disconnect(): Promise<void> {
    console.log('Disconnecting from WAV source...');
  }

  async play(): Promise<void> {
    console.log('Playing WAV source...');
    this.status = 'playing';
  }

  async pause(): Promise<void> {
    console.log('Pausing WAV source...');
    this.status = 'paused';
  }

  async stop(): Promise<void> {
    console.log('Stopping WAV source...');
    this.status = 'stopped';
  }
}
