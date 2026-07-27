import { AudioSource } from './AudioSource';

export class WebRTCSource extends AudioSource {
  constructor(
    id: string,
    name: string,
    sampleRate: number,
    channels: number,
    bufferSize: number
  ) {
    super(id, name, 'webrtc', sampleRate, channels, bufferSize);
  }

  async connect(): Promise<void> {
    console.log('Connecting to WebRTC source...');
  }

  async disconnect(): Promise<void> {
    console.log('Disconnecting from WebRTC source...');
  }

  async play(): Promise<void> {
    console.log('Playing WebRTC source...');
    this.status = 'playing';
  }

  async pause(): Promise<void> {
    console.log('Pausing WebRTC source...');
    this.status = 'paused';
  }

  async stop(): Promise<void> {
    console.log('Stopping WebRTC source...');
    this.status = 'stopped';
  }
}
