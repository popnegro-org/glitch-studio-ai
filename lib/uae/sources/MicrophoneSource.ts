import { AudioSource } from './AudioSource';

export class MicrophoneSource extends AudioSource {
  constructor(
    id: string,
    name: string,
    sampleRate: number,
    channels: number,
    bufferSize: number
  ) {
    super(id, name, 'microphone', sampleRate, channels, bufferSize);
  }

  private mediaStream: MediaStream | null = null;

  async connect(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.status = 'playing';
      console.log('Connected to microphone source.');
    } catch (error) {
      this.status = 'error';
      console.error('Error connecting to microphone source:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
      this.status = 'stopped';
      console.log('Disconnected from microphone source.');
    }
  }

  async play(): Promise<void> {
    console.log('Playing microphone source...');
    this.status = 'playing';
  }

  async pause(): Promise<void> {
    console.log('Pausing microphone source...');
    this.status = 'paused';
  }

  async stop(): Promise<void> {
    console.log('Stopping microphone source...');
    this.status = 'stopped';
  }
}
