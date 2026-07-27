import { AudioSource } from './AudioSource';

export class MP3Source extends AudioSource {
  constructor(
    id: string,
    name: string,
    sampleRate: number,
    channels: number,
    bufferSize: number
  ) {
    super(id, name, 'mp3', sampleRate, channels, bufferSize);
  }

  async connect(): Promise<void> {
    console.log('Connecting to MP3 source...');
  }

  async disconnect(): Promise<void> {
    console.log('Disconnecting from MP3 source...');
  }

  async play(): Promise<void> {
    console.log('Playing MP3 source...');
    this.status = 'playing';
  }

  async pause(): Promise<void> {
    console.log('Pausing MP3 source...');
    this.status = 'paused';
  }

  async stop(): Promise<void> {
    console.log('Stopping MP3 source...');
    this.status = 'stopped';
  }
}
