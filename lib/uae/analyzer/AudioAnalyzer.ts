import { AudioFeatures } from '../types';

export class AudioAnalyzer {
  private audioContext: AudioContext;
  public analyser: AnalyserNode;

  constructor(private sampleRate: number, private fftSize: number = 2048) {
    this.audioContext = new AudioContext({ sampleRate });
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = this.fftSize;
  }

  public getAnalyserNode(): AnalyserNode {
    return this.analyser;
  }

  public update(): AudioFeatures {
    const frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(frequencyData);

    const timeDomainData = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(timeDomainData);

    const rms = Math.sqrt(
      timeDomainData.reduce((acc, val) => acc + (val * val), 0) / timeDomainData.length
    );

    const peak = Math.max(...timeDomainData);

    return {
      fft: Array.from(frequencyData),
      rms: [rms],
      peak: [peak],
      envelope: [],
      transient: [],
      beat: [],
      bpm: [],
      spectralFlux: [],
      centroid: [],
      rollOff: [],
      zeroCrossingRate: [],
      pitch: [],
      loudness: [],
      bandEnergy: [],
      dynamicRange: [],
      silence: [],
      onset: [],
    };
  }
}
