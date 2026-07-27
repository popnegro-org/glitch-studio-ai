import { AudioSource } from './AudioSource';

export class FLACSource extends AudioSource {
  constructor(
    id: string,
    name: string,
    sampleRate: number,
    channels: number,
    bufferSize: number
  ) {
    super(id, name, 'flac', sampleRate, channels, bufferSize);
  }

  async connect(): Promise<void> {
    console.log('Connecting to FLAC source...');
  }

  async disconnect(): Promise<void> {
    console.log('Disconnecting from FLAC source...');
  }

  async play(): Promise<void> {
    console.log('Playing FLAC source...');
    this.status = 'playing';
  }

  async pause(): Promise<void> {
    console.log('Pausing FLAC source...');
    this.status = 'paused';
  }

  async stop(): Promise<void> {
    console.log('Stopping FLAC source...');
    this.status = 'stopped';
  }
}
