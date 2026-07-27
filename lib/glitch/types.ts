export type ParamDef = {
  key: string
  label: string
  min: number
  max: number
  step: number
  default: number
}

export type EffectCategory =
  | 'temporal'
  | 'compression'
  | 'analog'
  | 'optical'
  | 'distortion'
  | 'dither'
  | 'color'

export type EffectDef = {
  id: string
  name: string
  category: EffectCategory
  blurb: string
  /** GLSL source defining `vec3 effect(vec2 uv)` */
  code: string
  params: ParamDef[]
}

export type GlitchNode = {
  id: string
  effect: string
  enabled: boolean
  /** master mix of this stage, 0..1 */
  intensity: number
  /** how much the live audio level pushes the mix, 0..1 */
  audioMod: number
  params: Record<string, number>
}

export type RandomMode = 'deterministic' | 'semi' | 'chaos'

export type SourceKind = 'signal' | 'image' | 'video' | 'webcam' | 'screen'
