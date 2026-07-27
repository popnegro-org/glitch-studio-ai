'use client'

import { create } from 'zustand'
import { defaultParams, EFFECT_MAP } from './glitch/effects'
import { chainFromStages, nodeId, PRESETS, type PresetStage } from './glitch/presets'
import type { GlitchNode, RandomMode, SourceKind } from './glitch/types'

export type MediaItem = {
  id: string
  kind: SourceKind
  label: string
  url?: string
}

const BUILT_IN_MEDIA: MediaItem[] = [
  { id: 'signal', kind: 'signal', label: 'Test Signal / Gen' },
  { id: 'plate-city', kind: 'image', label: 'Night City Plate', url: '/media/plate-city.png' },
  { id: 'plate-portrait', kind: 'image', label: 'Portrait Plate', url: '/media/plate-portrait.png' },
  { id: 'plate-static', kind: 'image', label: 'Dead Channel', url: '/media/plate-static.png' },
]

type StudioState = {
  media: MediaItem[]
  activeMedia: MediaItem
  chain: GlitchNode[]
  selectedId: string | null
  seed: number
  randomMode: RandomMode
  playing: boolean
  audioReactive: boolean
  audioLevel: number
  activePreset: string | null
  aiStatus: 'idle' | 'thinking' | 'error'
  aiNote: string | null

  setActiveMedia: (item: MediaItem) => void
  addMedia: (item: MediaItem) => void
  addEffect: (effect: string) => void
  removeNode: (id: string) => void
  toggleNode: (id: string) => void
  selectNode: (id: string | null) => void
  moveNode: (id: string, dir: -1 | 1) => void
  updateParam: (id: string, key: string, value: number) => void
  updateNode: (id: string, patch: Partial<GlitchNode>) => void
  clearChain: () => void
  loadPreset: (presetId: string) => void
  applyStages: (stages: PresetStage[], note?: string) => void
  setSeed: (seed: number) => void
  rollSeed: () => void
  setRandomMode: (mode: RandomMode) => void
  togglePlaying: () => void
  setAudioReactive: (on: boolean) => void
  setAudioLevel: (level: number) => void
  setAiStatus: (status: 'idle' | 'thinking' | 'error', note?: string | null) => void
}

const initialChain = chainFromStages(PRESETS[0].chain)

export const useStudio = create<StudioState>((set, get) => ({
  media: BUILT_IN_MEDIA,
  activeMedia: BUILT_IN_MEDIA[0],
  chain: initialChain,
  selectedId: initialChain[0]?.id ?? null,
  seed: 1337,
  randomMode: 'deterministic',
  playing: true,
  audioReactive: false,
  audioLevel: 0,
  activePreset: PRESETS[0].id,
  aiStatus: 'idle',
  aiNote: null,

  setActiveMedia: (item) => set({ activeMedia: item }),
  addMedia: (item) => set((s) => ({ media: [item, ...s.media], activeMedia: item })),

  addEffect: (effect) => {
    if (!EFFECT_MAP[effect]) return
    const node: GlitchNode = {
      id: nodeId(),
      effect,
      enabled: true,
      intensity: 0.8,
      audioMod: 0,
      params: defaultParams(effect),
    }
    set((s) => ({ chain: [...s.chain, node], selectedId: node.id, activePreset: null }))
  },

  removeNode: (id) =>
    set((s) => {
      const chain = s.chain.filter((n) => n.id !== id)
      return { chain, selectedId: s.selectedId === id ? (chain[chain.length - 1]?.id ?? null) : s.selectedId, activePreset: null }
    }),

  toggleNode: (id) =>
    set((s) => ({ chain: s.chain.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n)) })),

  selectNode: (id) => set({ selectedId: id }),

  moveNode: (id, dir) =>
    set((s) => {
      const i = s.chain.findIndex((n) => n.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= s.chain.length) return s
      const chain = [...s.chain]
      ;[chain[i], chain[j]] = [chain[j], chain[i]]
      return { chain, activePreset: null }
    }),

  updateParam: (id, key, value) =>
    set((s) => ({
      chain: s.chain.map((n) => (n.id === id ? { ...n, params: { ...n.params, [key]: value } } : n)),
    })),

  updateNode: (id, patch) =>
    set((s) => ({ chain: s.chain.map((n) => (n.id === id ? { ...n, ...patch } : n)) })),

  clearChain: () => set({ chain: [], selectedId: null, activePreset: null }),

  loadPreset: (presetId) => {
    const preset = PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    const chain = chainFromStages(preset.chain)
    set({ chain, selectedId: chain[0]?.id ?? null, activePreset: preset.id, aiNote: null })
  },

  applyStages: (stages, note) => {
    const valid = stages.filter((s) => EFFECT_MAP[s.effect])
    if (!valid.length) return
    const chain = chainFromStages(valid)
    set({ chain, selectedId: chain[0]?.id ?? null, activePreset: null, aiNote: note ?? null })
  },

  setSeed: (seed) => set({ seed }),
  rollSeed: () => set({ seed: Math.floor(Math.random() * 9999) }),
  setRandomMode: (randomMode) => set({ randomMode }),
  togglePlaying: () => set((s) => ({ playing: !s.playing })),
  setAudioReactive: (audioReactive) => set({ audioReactive }),
  setAudioLevel: (audioLevel) => set({ audioLevel }),
  setAiStatus: (aiStatus, aiNote) =>
    set({ aiStatus, aiNote: aiNote === undefined ? get().aiNote : aiNote }),
}))
