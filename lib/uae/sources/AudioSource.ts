import { AudioSource as IAudioSource } from '../types';

export abstract class AudioSource implements IAudioSource {
  public mediaStream: MediaStream | null = null;
  id: string;
  name: string;
  type: string;
  latency: number;
  status: 'playing' | 'paused' | 'stopped' | 'buffering' | 'error';
  sampleRate: number;
  channels: number;
  bufferSize: number;

  constructor(
    id: string,
    name: string,
    type: string,
    sampleRate: number,
    channels: number,
    bufferSize: number
  ) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.latency = 0;
    this.status = 'stopped';
    this.sampleRate = sampleRate;
    this.channels = channels;
    this.bufferSize = bufferSize;
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract play(): Promise<void>;
  abstract pause(): Promise<void>;
  abstract stop(): Promise<void>;
}
