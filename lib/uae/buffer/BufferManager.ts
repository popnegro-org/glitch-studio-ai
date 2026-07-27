export class BufferManager {
  private buffer: AudioBuffer | null = null;

  constructor(private bufferSize: number) {}

  public write(data: AudioBuffer) {
    // In a real implementation, this would be a circular buffer
    this.buffer = data;
  }

  public read(): AudioBuffer | null {
    const data = this.buffer;
    this.buffer = null;
    return data;
  }
}
