import { defaultParams } from './effects'
import type { GlitchNode } from './types'

export type PresetStage = {
  effect: string
  intensity?: number
  audioMod?: number
  params?: Record<string, number>
}

export type Preset = {
  id: string
  name: string
  blurb: string
  chain: PresetStage[]
}

let counter = 0
export function nodeId() {
  counter += 1
  return `n${Date.now().toString(36)}${counter.toString(36)}`
}

export function stageToNode(stage: PresetStage): GlitchNode {
  return {
    id: nodeId(),
    effect: stage.effect,
    enabled: true,
    intensity: stage.intensity ?? 0.8,
    audioMod: stage.audioMod ?? 0,
    params: { ...defaultParams(stage.effect), ...(stage.params ?? {}) },
  }
}

export function chainFromStages(stages: PresetStage[]): GlitchNode[] {
  return stages.map(stageToNode)
}

export const PRESETS: Preset[] = [
  {
    id: 'broken-vhs',
    name: 'Broken VHS',
    blurb: 'Rental tape watched one time too many.',
    chain: [
      { effect: 'vhs', intensity: 0.95, params: { wobble: 0.55, bleed: 0.7, tracking: 0.5, noise: 0.4 } },
      { effect: 'tape', intensity: 0.6 },
      { effect: 'scanlines', intensity: 0.5, params: { density: 520, strength: 0.45, roll: 0.4, interlace: 0.35 } },
      { effect: 'grade', intensity: 1, params: { hue: -0.1, sat: 0.85, contrast: 1.15, lift: 0.01 } },
    ],
  },
  {
    id: 'ghost-memory',
    name: 'Ghost Memory',
    blurb: 'Something half-remembered, trailing behind itself.',
    chain: [
      { effect: 'echo', intensity: 0.85, params: { decay: 0.9, driftX: 0.003, driftY: -0.002, tint: 0.6 } },
      { effect: 'displace', intensity: 0.5, params: { scale: 2.4, strength: 0.03, speed: 0.15, chroma: 0.5 } },
      { effect: 'bloom', intensity: 0.7, params: { threshold: 0.5, intensity: 1.2, radius: 6, tint: 0.5 } },
      { effect: 'grade', intensity: 1, params: { hue: 0.25, sat: 0.7, contrast: 0.95, lift: 0.03 } },
    ],
  },
  {
    id: 'liquid-datamosh',
    name: 'Liquid Datamosh',
    blurb: 'Macroblocks melting into a slow current.',
    chain: [
      { effect: 'datamosh', intensity: 0.95, params: { corruption: 0.8, block: 34, persistence: 0.93, frequency: 0.7 } },
      { effect: 'liquid', intensity: 0.7, params: { scale: 2.2, strength: 0.1, speed: 0.2, swirl: 1.8 } },
      { effect: 'grade', intensity: 1, params: { hue: 0.4, sat: 1.4, contrast: 1.1, lift: 0 } },
    ],
  },
  {
    id: 'compression-hell',
    name: 'Compression Hell',
    blurb: 'Re-encoded four hundred times.',
    chain: [
      { effect: 'jpeg', intensity: 1, params: { block: 10, quant: 4, bleed: 0.85, ring: 0.7 } },
      { effect: 'blockshift', intensity: 0.9, params: { block: 40, density: 0.45, shift: 0.14, rate: 10 } },
      { effect: 'posterize', intensity: 0.7, params: { levels: 6, cut: 0, soft: 0.05, duotone: 0 } },
    ],
  },
  {
    id: 'lost-signal',
    name: 'Lost Signal',
    blurb: 'Broadcast dropping out band by band.',
    chain: [
      { effect: 'slice', intensity: 0.95, params: { slices: 60, shift: 0.12, rate: 9, density: 0.5 } },
      { effect: 'rgbsplit', intensity: 0.8, audioMod: 0.2, params: { offset: 0.02, angle: 0, jitter: 0.6, radial: 0.2 } },
      { effect: 'noise', intensity: 0.6, params: { amount: 0.45, color: 0.5, snow: 0.25, scale: 1.4 } },
      { effect: 'crt', intensity: 0.8 },
    ],
  },
  {
    id: 'pixel-collapse',
    name: 'Pixel Collapse',
    blurb: 'Resolution failing under its own weight.',
    chain: [
      { effect: 'pixelsort', intensity: 0.9, params: { threshold: 0.42, length: 0.18, vertical: 0, invert: 0 } },
      { effect: 'pixelate', intensity: 0.6, params: { size: 10, aspect: 1, levels: 12, jitter: 0.2 } },
      { effect: 'grade', intensity: 1, params: { hue: -0.5, sat: 1.5, contrast: 1.25, lift: -0.02 } },
    ],
  },
  {
    id: 'neural-corruption',
    name: 'Neural Corruption',
    blurb: 'A model hallucinating over its own output.',
    chain: [
      { effect: 'feedback', intensity: 0.8, params: { zoom: 0.02, rotate: 0.03, decay: 0.93, hue: 0.6 } },
      { effect: 'displace', intensity: 0.7, params: { scale: 6, strength: 0.05, speed: 0.5, chroma: 0.6 } },
      { effect: 'edge', intensity: 0.45, params: { strength: 2.4, width: 1.2, base: 0.5, tint: 0.7 } },
      { effect: 'bloom', intensity: 0.6 },
    ],
  },
  {
    id: 'internet-1998',
    name: 'Internet 1998',
    blurb: 'Dithered, indexed, downloaded over a modem.',
    chain: [
      { effect: 'pixelate', intensity: 1, params: { size: 5, aspect: 1, levels: 32, jitter: 0 } },
      { effect: 'dither', intensity: 1, params: { levels: 4, strength: 1, scale: 2, mono: 0.2 } },
      { effect: 'noise', intensity: 0.3, params: { amount: 0.2, color: 0.2, snow: 0.05, scale: 2 } },
    ],
  },
  {
    id: 'terminal-dream',
    name: 'Terminal Dream',
    blurb: 'The frame recompiled as glyphs.',
    chain: [
      { effect: 'ascii', intensity: 1, params: { cell: 9, contrast: 1.3, colored: 0.15, bg: 0 } },
      { effect: 'bloom', intensity: 0.5, params: { threshold: 0.4, intensity: 0.9, radius: 3, tint: 0.7 } },
      { effect: 'scanlines', intensity: 0.35, params: { density: 700, strength: 0.35, roll: 0.2, interlace: 0.2 } },
    ],
  },
  {
    id: 'infinite-feedback',
    name: 'Infinite Feedback',
    blurb: 'Camera pointed at its own monitor, forever.',
    chain: [
      { effect: 'feedback', intensity: 0.92, audioMod: 0.15, params: { zoom: 0.05, rotate: 0.09, decay: 0.95, hue: 0.5 } },
      { effect: 'rgbsplit', intensity: 0.5, params: { offset: 0.008, angle: 1.2, jitter: 0.3, radial: 0.6 } },
      { effect: 'bloom', intensity: 0.8, params: { threshold: 0.55, intensity: 1.4, radius: 5, tint: 0.3 } },
    ],
  },
  {
    id: 'last-frame',
    name: 'Last Frame Before Blackout',
    blurb: 'Everything failing at once, briefly beautiful.',
    chain: [
      { effect: 'holdframe', intensity: 0.8, params: { rate: 5, bands: 9, hold: 0.75, slide: 0.04 } },
      { effect: 'datamosh', intensity: 0.7, params: { corruption: 0.6, block: 18, persistence: 0.8, frequency: 0.8 } },
      { effect: 'tape', intensity: 0.7, params: { intensity: 0.7, frequency: 0.6, tear: 0.22, burn: 0.6 } },
      { effect: 'lens', intensity: 0.8, params: { distort: 0.2, aberration: 0.02, zoom: 1.02, edge: 0.55 } },
    ],
  },
]
