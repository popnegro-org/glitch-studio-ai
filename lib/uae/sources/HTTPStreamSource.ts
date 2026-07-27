import { AudioSource } from './AudioSource';

export class HTTPStreamSource extends AudioSource {
  constructor(
    id: string,
    name: string,
    sampleRate: number,
    channels: number,
    bufferSize: number,
    private url: string
  ) {
    super(id, name, 'http-stream', sampleRate, channels, bufferSize);
  }

  async connect(): Promise<void> {
    console.log(`Connecting to HTTP stream source at ${this.url}...`);
  }

  async disconnect(): Promise<void> {
    console.log('Disconnecting from HTTP stream source...');
  }

  async play(): Promise<void> {
    console.log('Playing HTTP stream source...');
    this.status = 'playing';
  }

  async pause(): Promise<void> {
    console.log('Pausing HTTP stream source...');
    this.status = 'paused';
  }

  async stop(): Promise<void> {
    console.log('Stopping HTTP stream source...');
    this.status = 'stopped';
  }
}
