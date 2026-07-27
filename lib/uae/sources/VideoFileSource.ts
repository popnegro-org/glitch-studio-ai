import { AudioSource } from './AudioSource';

export class VideoFileSource extends AudioSource {
  constructor(
    id: string,
    name: string,
    sampleRate: number,
    channels: number,
    bufferSize: number
  ) {
    super(id, name, 'video', sampleRate, channels, bufferSize);
  }

  async connect(): Promise<void> {
    console.log('Connecting to video file source...');
  }

  async disconnect(): Promise<void> {
    console.log('Disconnecting from video file source...');
  }

  async play(): Promise<void> {
    console.log('Playing video file source...');
    this.status = 'playing';
  }

  async pause(): Promise<void> {
    console.log('Pausing video file source...');
    this.status = 'paused';
  }

  async stop(): Promise<void> {
    console.log('Stopping video file source...');
    this.status = 'stopped';
  }
}
