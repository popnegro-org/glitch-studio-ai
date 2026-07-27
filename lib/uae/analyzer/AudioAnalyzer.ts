import { AudioFeatures } from '../types';
import Meyda from 'meyda';

export class AudioAnalyzer {
  private audioContext: AudioContext;
  public analyser: AnalyserNode | null = null;
  private meyda: Meyda.MeydaAnalyzer | null = null;

  constructor(private sampleRate: number, private fftSize: number = 2048) {
    this.audioContext = new AudioContext({ sampleRate });
  }

  public connectSource(sourceNode: AudioNode) {
    this.meyda = Meyda.createMeydaAnalyzer({
      audioContext: this.audioContext,
      source: sourceNode,
      bufferSize: this.fftSize,
      featureExtractors: [
        'fft',
        'loudness',
        'spectralCentroid',
        'spectralRolloff',
        'spectralFlux',
        'zeroCrossingRate',
      ],
      callback: () => {},
    });
    this.analyser = this.meyda.analyser;
  }

  public getAnalyserNode(): AnalyserNode {
    if (!this.analyser) {
      throw new Error('AudioAnalyzer is not connected to a source.');
    }
    return this.analyser;
  }

  public update(): AudioFeatures {
    if (!this.meyda) {
      return this.getEmptyFeatures();
    }
    const features = this.meyda.get();
    if (!features) {
      return this.getEmptyFeatures();
    }

    return {
      fft: features.fft ? Array.from(features.fft) : [],
      rms: [], // Meyda doesn't have a direct RMS feature, it has loudness
      peak: [],
      envelope: [],
      transient: [],
      beat: [],
      bpm: [],
      spectralFlux: features.spectralFlux ?? 0,
      centroid: features.spectralCentroid ?? 0,
      rollOff: features.spectralRolloff ?? 0,
      zeroCrossingRate: features.zeroCrossingRate ?? 0,
      pitch: [],
      loudness: features.loudness ? features.loudness.total : 0,
      bandEnergy: [],
      dynamicRange: [],
      silence: [],
      onset: [],
    };
  }

  private getEmptyFeatures(): AudioFeatures {
    return {
      fft: [],
      rms: [],
      peak: [],
      envelope: [],
      transient: [],
      beat: [],
      bpm: [],
      spectralFlux: 0,
      centroid: 0,
      rollOff: 0,
      zeroCrossingRate: 0,
      pitch: [],
      loudness: 0,
      bandEnergy: [],
      dynamicRange: [],
      silence: [],
      onset: [],
    };
  }

  public async analyze(buffer: AudioBuffer): Promise<AudioFeatures> {
    // This is a simplified implementation for offline analysis
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    this.connectSource(source);
    
    return new Promise(resolve => {
      source.onended = () => {
        const features = this.update();
        resolve(features);
      };
      source.start();
    });
  }
}
