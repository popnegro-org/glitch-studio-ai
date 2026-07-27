import { AudioSource } from './AudioSource';

export class WebcamSource extends AudioSource {
  constructor(
    id: string,
    name: string,
    sampleRate: number,
    channels: number,
    bufferSize: number
  ) {
    super(id, name, 'webcam', sampleRate, channels, bufferSize);
  }

  private mediaStream: MediaStream | null = null;

  async connect(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      this.status = 'playing';
      console.log('Connected to webcam source.');
    } catch (error) {
      this.status = 'error';
      console.error('Error connecting to webcam source:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
      this.status = 'stopped';
      console.log('Disconnected from webcam source.');
    }
  }

  async play(): Promise<void> {
    console.log('Playing webcam source...');
    this.status = 'playing';
  }

  async pause(): Promise<void> {
    console.log('Pausing webcam source...');
    this.status = 'paused';
  }

  async stop(): Promise<void> {
    console.log('Stopping webcam source...');
    this.status = 'stopped';
  }
}
