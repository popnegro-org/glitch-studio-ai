import { AudioSource } from './AudioSource';

export class BrowserAudioSource extends AudioSource {
  constructor(
    id: string,
    name: string,
    sampleRate: number,
    channels: number,
    bufferSize: number
  ) {
    super(id, name, 'browser', sampleRate, channels, bufferSize);
  }

  private mediaStream: MediaStream | null = null;

  async connect(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      this.status = 'playing';
      console.log('Connected to browser audio source.');
    } catch (error) {
      this.status = 'error';
      console.error('Error connecting to browser audio source:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
      this.status = 'stopped';
      console.log('Disconnected from browser audio source.');
    }
  }

  async play(): Promise<void> {
    console.log('Playing browser audio source...');
    this.status = 'playing';
  }

  async pause(): Promise<void> {
    console.log('Pausing browser audio source...');
    this.status = 'paused';
  }

  async stop(): Promise<void> {
    console.log('Stopping browser audio source...');
    this.status = 'stopped';
  }
}
