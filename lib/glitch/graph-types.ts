export interface Node {
  id: string;
  type: string; // Corresponds to an effect key in EFFECT_MAP
  position: { x: number; y: number };
  enabled?: boolean;
  intensity?: number;
  audioMod?: number;
  params?: Record<string, number>;
}

export interface Edge {
  id: string;
  sourceNodeId: string;
  sourceOutputName: string;
  targetNodeId: string;
  targetInputName: string;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
}
