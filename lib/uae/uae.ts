import {
  AudioSource,
  MP3Source,
  WAVSource,
  FLACSource,
  OGGSource,
  AACSource,
  MicrophoneSource,
  BrowserAudioSource,
  WebcamSource,
  VideoFileSource,
  HTTPStreamSource,
  WebRTCSource,
  VirtualAudioCableSource,
  MIDIClockSource,
  OSCSource,
  ExternalAPISource,
  Decoder,
  BufferManager,
  AudioAnalyzer,
  AIAudio,
  AutomationEngine,
  Synchronization,
  Visualizer,
  Exporter,
  Plugin,
} from './';

export class UAE {
  private decoder: Decoder;
  private bufferManager: BufferManager;
  private audioAnalyzer: AudioAnalyzer;
  private aiAudio: AIAudio;
  private automationEngine: AutomationEngine;
  private synchronization: Synchronization;
  private visualizer: Visualizer | null = null;
  private exporter: Exporter;
  private plugins: Plugin[] = [];

  constructor(
    sampleRate: number,
    bufferSize: number,
    fftSize: number,
    visualizationContainer?: HTMLElement
  ) {
    this.decoder = new Decoder();
    this.bufferManager = new BufferManager(bufferSize);
    this.audioAnalyzer = new AudioAnalyzer(sampleRate, fftSize);
    this.aiAudio = new AIAudio();
    this.automationEngine = new AutomationEngine();
    this.synchronization = new Synchronization();
    if (visualizationContainer) {
      this.visualizer = new Visualizer(visualizationContainer);
    }
    this.exporter = new Exporter();
  }

  public createAudioSource(
    id: string,
    name: string,
    type: string,
    sampleRate: number,
    channels: number,
    bufferSize: number,
    url?: string
  ): AudioSource {
    switch (type) {
      case 'mp3':
        return new MP3Source(id, name, sampleRate, channels, bufferSize);
      case 'wav':
        return new WAVSource(id, name, sampleRate, channels, bufferSize);
      case 'flac':
        return new FLACSource(id, name, sampleRate, channels, bufferSize);
      case 'ogg':
        return new OGGSource(id, name, sampleRate, channels, bufferSize);
      case 'aac':
        return new AACSource(id, name, sampleRate, channels, bufferSize);
      case 'microphone':
        return new MicrophoneSource(id, name, sampleRate, channels, bufferSize);
      case 'browser':
        return new BrowserAudioSource(id, name, sampleRate, channels, bufferSize);
      case 'webcam':
        return new WebcamSource(id, name, sampleRate, channels, bufferSize);
      case 'video':
        return new VideoFileSource(id, name, sampleRate, channels, bufferSize);
      case 'http-stream':
        if (!url) {
          throw new Error('URL is required for http-stream audio source');
        }
        return new HTTPStreamSource(id, name, sampleRate, channels, bufferSize, url);
      case 'webrtc':
        return new WebRTCSource(id, name, sampleRate, channels, bufferSize);
      case 'virtual-audio-cable':
        return new VirtualAudioCableSource(id, name, sampleRate, channels, bufferSize);
      case 'midi-clock':
        return new MIDIClockSource(id, name, sampleRate, channels, bufferSize);
      case 'osc':
        return new OSCSource(id, name, sampleRate, channels, bufferSize);
      case 'external-api':
        if (!url) {
          throw new Error('URL is required for external-api audio source');
        }
        return new ExternalAPISource(id, name, sampleRate, channels, bufferSize, url);
      default:
        throw new Error(`Unsupported audio source type: ${type}`);
    }
  }

  public connectAnalyzer(source: AudioSource & { mediaStream: MediaStream | null }) {
    if (source.mediaStream) {
      const audioContext = new AudioContext();
      const sourceNode = audioContext.createMediaStreamSource(source.mediaStream);
      this.audioAnalyzer.connectSource(sourceNode);
    }
  }

  public mapAudioParameter(
    sourceParameter: string,
    targetParameter: string,
    mappingFunction: (value: number) => number
  ) {
    // This is a placeholder. The actual implementation will map the audio
    // parameter to the visual parameter.
    console.log('Mapping audio parameter...', {
      sourceParameter,
      targetParameter,
      mappingFunction,
    });
  }

  private animationFrameId: number | null = null;

  public start() {
    const loop = () => {
      const features = this.audioAnalyzer.update();
      this.automationEngine.process(features);
      if (this.visualizer) {
        this.visualizer.renderFFT(features.fft);
        this.visualizer.renderVuMeter(features.rms[0]);
      }
      this.animationFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  public stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public importAudio(data: ArrayBuffer): Promise<AudioBuffer> {
    return this.decoder.decode(data);
  }

  public generateWaveform(buffer: AudioBuffer) {
    this.visualizer?.renderWaveform(buffer);
  }

  public generateSpectrum(buffer: AudioBuffer) {
    const features = this.audioAnalyzer.analyze(buffer);
    this.visualizer?.renderFFT(features.fft);
  }

  public detectBeat(buffer: AudioBuffer) {
    const features = this.audioAnalyzer.analyze(buffer);
    console.log('Beat detected:', features.beat);
  }

  public detectPitch(buffer: AudioBuffer) {
    const features = this.audioAnalyzer.analyze(buffer);
    console.log('Pitch detected:', features.pitch);
  }

  public installPlugin(plugin: Plugin) {
    plugin.install();
    this.plugins.push(plugin);
  }
}
