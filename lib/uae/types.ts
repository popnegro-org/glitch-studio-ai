export interface AudioSource {
  id: string;
  name: string;
  type: string;
  latency: number;
  status: 'playing' | 'paused' | 'stopped' | 'buffering' | 'error';
  sampleRate: number;
  channels: number;
  bufferSize: number;
}

export interface FFT extends Array<number> {}

export interface RMS extends Array<number> {}

export interface Peak extends Array<number> {}

export interface Envelope extends Array<number> {}

export interface Transient extends Array<number> {}

export interface Beat extends Array<number> {}

export interface BPM extends Array<number> {}

export interface SpectralFlux extends Array<number> {}

export interface Centroid extends Array<number> {}

export interface RollOff extends Array<number> {}

export interface ZeroCrossingRate extends Array<number> {}

export interface Pitch extends Array<number> {}

export interface Loudness extends Array<number> {}

export interface BandEnergy extends Array<number> {}

export interface DynamicRange extends Array<number> {}

export interface Silence extends Array<number> {}

export interface Onset extends Array<number> {}

export interface AudioFeatures {
  fft: FFT;
  rms: RMS;
  peak: Peak;
  envelope: Envelope;
  transient: Transient;
  beat: Beat;
  bpm: BPM;
  spectralFlux: SpectralFlux;
  centroid: Centroid;
  rollOff: RollOff;
  zeroCrossingRate: ZeroCrossingRate;
  pitch: Pitch;
  loudness: Loudness;
  bandEnergy: BandEnergy;
  dynamicRange: DynamicRange;
  silence: Silence;
  onset: Onset;
}
