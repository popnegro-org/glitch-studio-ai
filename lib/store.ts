'use client'

import { create } from 'zustand'
import { defaultParams, EFFECT_MAP } from './glitch/effects'
import { type RandomMode, type SourceKind } from './glitch/types'
import { type Edge, type Node, type Graph } from './glitch/graph-types'

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
  seed: number
  randomMode: RandomMode
  playing: boolean
  audioReactive: boolean
  audioLevel: number
  aiStatus: 'idle' | 'thinking' | 'error'
  aiNote: string | null

  graph: Graph
  selectedNodeId: string | null
  addNode: (node: Node) => void
  moveNode: (nodeId: string, position: { x: number; y: number }) => void
  selectNode: (nodeId: string | null) => void
  updateNode: (nodeId: string, patch: Partial<Node>) => void
  removeNode: (nodeId: string) => void

  setActiveMedia: (item: MediaItem) => void
  addMedia: (item: MediaItem) => void
  setSeed: (seed: number) => void
  rollSeed: () => void
  setRandomMode: (mode: RandomMode) => void
  togglePlaying: () => void
  setAudioReactive: (on: boolean) => void
  setAudioLevel: (level: number) => void
  setAiStatus: (status: 'idle' | 'thinking' | 'error', note?: string | null) => void
}

const initialGraph: Graph = {
  nodes: [
    { id: 'audio-input', type: 'audio-input', position: { x: 100, y: 100 }, enabled: true },
    { id: 'beat-detector', type: 'beat-detector', position: { x: 300, y: 100 }, enabled: true },
    { id: 'low-frequencies', type: 'low-frequencies', position: { x: 500, y: 100 }, enabled: true },
    { id: 'datamosh', type: 'datamosh', position: { x: 700, y: 100 }, enabled: true, intensity: 0.8, audioMod: 0, params: defaultParams('datamosh') },
    { id: 'rgb-split', type: 'rgb-split', position: { x: 700, y: 200 }, enabled: true, intensity: 0.8, audioMod: 0, params: defaultParams('rgb-split') },
    { id: 'pixel-sort', type: 'pixel-sort', position: { x: 700, y: 300 }, enabled: true, intensity: 0.8, audioMod: 0, params: defaultParams('pixel-sort') },
    { id: 'bloom', type: 'bloom', position: { x: 700, y: 400 }, enabled: true, intensity: 0.8, audioMod: 0, params: defaultParams('bloom') },
  ],
  edges: [
    { id: 'e1', sourceNodeId: 'audio-input', sourceOutputName: 'out', targetNodeId: 'beat-detector', targetInputName: 'in' },
    { id: 'e2', sourceNodeId: 'beat-detector', sourceOutputName: 'out', targetNodeId: 'low-frequencies', targetInputName: 'in' },
    { id: 'e3', sourceNodeId: 'low-frequencies', sourceOutputName: 'out', targetNodeId: 'datamosh', targetInputName: 'intensity' },
    { id: 'e4', sourceNodeId: 'low-frequencies', sourceOutputName: 'out', targetNodeId: 'rgb-split', targetInputName: 'in' },
    { id: 'e5', sourceNodeId: 'low-frequencies', sourceOutputName: 'out', targetNodeId: 'pixel-sort', targetInputName: 'in' },
    { id: 'e6', sourceNodeId: 'low-frequencies', sourceOutputName: 'out', targetNodeId: 'bloom', targetInputName: 'in' },
  ],
};

export const useStudio = create<StudioState>((set, get) => ({
  media: BUILT_IN_MEDIA,
  activeMedia: BUILT_IN_MEDIA[0],
  seed: 1337,
  randomMode: 'deterministic',
  playing: true,
  audioReactive: false,
  audioLevel: 0,
  aiStatus: 'idle',
  aiNote: null,
  graph: initialGraph,
  selectedNodeId: null,

  addNode: (node) => set(state => ({ graph: { ...state.graph, nodes: [...state.graph.nodes, node] } })),
  moveNode: (nodeId, position) => set(state => ({
    graph: {
      ...state.graph,
      nodes: state.graph.nodes.map(n => n.id === nodeId ? { ...n, position } : n),
    }
  })),
  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
  updateNode: (nodeId, patch) => set(state => ({
    graph: {
      ...state.graph,
      nodes: state.graph.nodes.map(n => n.id === nodeId ? { ...n, ...patch } : n),
    }
  })),
   removeNode: (nodeId) => set(state => ({
    graph: {
      ...state.graph,
      nodes: state.graph.nodes.filter(n => n.id !== nodeId),
      edges: state.graph.edges.filter(e => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId),
    },
    selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
  })),

  setActiveMedia: (item) => set({ activeMedia: item }),
  addMedia: (item) => set((s) => ({ media: [item, ...s.media], activeMedia: item })),

  setSeed: (seed) => set({ seed }),
  rollSeed: () => set({ seed: Math.floor(Math.random() * 9999) }),
  setRandomMode: (randomMode) => set({ randomMode }),
  togglePlaying: () => set((s) => ({ playing: !s.playing })),
  setAudioReactive: (audioReactive) => set({ audioReactive }),
  setAudioLevel: (audioLevel) => set({ audioLevel }),
  setAiStatus: (aiStatus, aiNote) =>
    set({ aiStatus, aiNote: aiNote === undefined ? get().aiNote : aiNote }),
}))

