import { AudioSource } from './AudioSource';

export class OSCSource extends AudioSource {
  constructor(
    id: string,
    name: string,
    sampleRate: number,
    channels: number,
    bufferSize: number
  ) {
    super(id, name, 'osc', sampleRate, channels, bufferSize);
  }

  async connect(): Promise<void> {
    console.log('Connecting to OSC source...');
  }

  async disconnect(): Promise<void> {
    console.log('Disconnecting from OSC source...');
  }

  async play(): Promise<void> {
    console.log('Playing OSC source...');
    this.status = 'playing';
  }

  async pause(): Promise<void> {
    console.log('Pausing OSC source...');
    this.status = 'paused';
  }

  async stop(): Promise<void> {
    console.log('Stopping OSC source...');
    this.status = 'stopped';
  }
}
