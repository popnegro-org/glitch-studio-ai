import { EFFECT_MAP, SHADER_PRELUDE } from './effects'
import type { GlitchNode, RandomMode } from './types'

const VERT = /* glsl */ `
attribute vec2 aPos;
varying vec2 vUv;
void main(){
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

const COPY_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D u_tex;
void main(){ gl_FragColor = vec4(texture2D(u_tex, vUv).rgb, 1.0); }`

const UNIFORMS = ['u_tex', 'u_prev', 'u_res', 'u_time', 'u_seed', 'u_audio', 'u_amount', 'u_p0', 'u_p1', 'u_p2', 'u_p3'] as const

type Program = {
  program: WebGLProgram
  loc: Record<string, WebGLUniformLocation | null>
}

type Target = { fbo: WebGLFramebuffer; tex: WebGLTexture }

export type SourceElement = HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | null

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const sh = gl.createShader(type)!
  gl.shaderSource(sh, source)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh)
    gl.deleteShader(sh)
    throw new Error(`shader compile failed: ${log}`)
  }
  return sh
}

export class GlitchRenderer {
  private gl: WebGLRenderingContext
  private quad: WebGLBuffer
  private programs = new Map<string, Program>()
  private copy: Program
  private srcTex: WebGLTexture
  private targets: Target[] = []
  private history: Target | null = null
  private width = 0
  private height = 0
  private source: SourceElement = null
  private sourceDirty = true
  private jitter = new Map<string, number>()
  private jitterAt = 0

  seed = 1337
  audioLevel = 0
  randomMode: RandomMode = 'deterministic'
  time = 0

  constructor(private canvas: HTMLCanvasElement) {
    const gl = (canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false }) ||
      canvas.getContext('webgl', { preserveDrawingBuffer: true, antialias: false })) as WebGLRenderingContext | null
    if (!gl) throw new Error('WebGL unavailable')
    this.gl = gl

    this.quad = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)

    this.copy = this.buildProgram(COPY_FRAG)
    this.srcTex = this.createTexture()
    this.resize(canvas.width, canvas.height)
  }

  private buildProgram(frag: string): Program {
    const gl = this.gl
    const program = gl.createProgram()!
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT))
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, frag))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`program link failed: ${gl.getProgramInfoLog(program)}`)
    }
    const loc: Record<string, WebGLUniformLocation | null> = {}
    for (const u of UNIFORMS) loc[u] = gl.getUniformLocation(program, u)
    return { program, loc }
  }

  private programFor(effectId: string): Program | null {
    const cached = this.programs.get(effectId)
    if (cached) return cached
    const def = EFFECT_MAP[effectId]
    if (!def) return null
    const frag = `${SHADER_PRELUDE}\n${def.code}\nvoid main(){\n  vec3 base = texture2D(u_tex, vUv).rgb;\n  vec3 col = effect(vUv);\n  gl_FragColor = vec4(mix(base, col, u_amount), 1.0);\n}`
    try {
      const p = this.buildProgram(frag)
      this.programs.set(effectId, p)
      return p
    } catch (err) {
      console.log('[v0] effect compile error', effectId, err)
      return null
    }
  }

  private createTexture() {
    const gl = this.gl
    const tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    return tex
  }

  private createTarget(w: number, h: number): Target {
    const gl = this.gl
    const tex = this.createTexture()
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    const fbo = gl.createFramebuffer()!
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    return { fbo, tex }
  }

  resize(w: number, h: number) {
    w = Math.max(2, Math.floor(w))
    h = Math.max(2, Math.floor(h))
    if (w === this.width && h === this.height) return
    const gl = this.gl
    this.width = w
    this.height = h
    this.canvas.width = w
    this.canvas.height = h
    for (const t of this.targets) {
      gl.deleteFramebuffer(t.fbo)
      gl.deleteTexture(t.tex)
    }
    if (this.history) {
      gl.deleteFramebuffer(this.history.fbo)
      gl.deleteTexture(this.history.tex)
    }
    this.targets = [this.createTarget(w, h), this.createTarget(w, h)]
    this.history = this.createTarget(w, h)
    this.sourceDirty = true
  }

  setSource(el: SourceElement) {
    this.source = el
    this.sourceDirty = true
  }

  markSourceDirty() {
    this.sourceDirty = true
  }

  private uploadSource() {
    const gl = this.gl
    const el = this.source
    if (!el) return
    const isVideo = typeof HTMLVideoElement !== 'undefined' && el instanceof HTMLVideoElement
    const isCanvas = typeof HTMLCanvasElement !== 'undefined' && el instanceof HTMLCanvasElement
    if (isVideo) {
      const v = el as HTMLVideoElement
      if (v.readyState < 2) return
    }
    if (!isVideo && !isCanvas && !this.sourceDirty) return
    gl.bindTexture(gl.TEXTURE_2D, this.srcTex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, el as TexImageSource)
      this.sourceDirty = false
    } catch {
      // cross-origin or not-yet-decoded media
    }
  }

  private drawQuad(prog: Program) {
    const gl = this.gl
    gl.useProgram(prog.program)
    const aPos = gl.getAttribLocation(prog.program, 'aPos')
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad)
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  private nodeJitter(node: GlitchNode, now: number) {
    if (this.randomMode === 'deterministic') return 1
    if (now - this.jitterAt > (this.randomMode === 'chaos' ? 90 : 220)) {
      this.jitter.clear()
      this.jitterAt = now
    }
    let j = this.jitter.get(node.id)
    if (j === undefined) {
      const spread = this.randomMode === 'chaos' ? 0.75 : 0.28
      j = 1 + (Math.random() - 0.5) * 2 * spread
      this.jitter.set(node.id, j)
    }
    return j
  }

  render(chain: GlitchNode[], now: number) {
    const gl = this.gl
    if (!this.history) return
    this.uploadSource()
    gl.viewport(0, 0, this.width, this.height)

    let currentTex = this.srcTex
    let ping = 0
    const active = chain.filter((n) => n.enabled && EFFECT_MAP[n.effect])

    for (const node of active) {
      const prog = this.programFor(node.effect)
      const def = EFFECT_MAP[node.effect]
      if (!prog || !def) continue
      const target = this.targets[ping]
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo)
      gl.useProgram(prog.program)

      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, currentTex)
      gl.uniform1i(prog.loc.u_tex, 0)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, this.history.tex)
      gl.uniform1i(prog.loc.u_prev, 1)

      const amount = Math.min(1, Math.max(0, node.intensity + node.audioMod * this.audioLevel) * this.nodeJitter(node, now))
      gl.uniform2f(prog.loc.u_res, this.width, this.height)
      gl.uniform1f(prog.loc.u_time, this.time)
      gl.uniform1f(prog.loc.u_seed, this.seed % 10000)
      gl.uniform1f(prog.loc.u_audio, this.audioLevel)
      gl.uniform1f(prog.loc.u_amount, amount)

      for (let i = 0; i < 4; i++) {
        const p = def.params[i]
        const value = p ? (node.params[p.key] ?? p.default) : 0
        gl.uniform1f(prog.loc[`u_p${i}`], value)
      }

      this.drawQuad(prog)
      currentTex = target.tex
      ping = 1 - ping
    }

    // history <- final composite (used by feedback / datamosh stages next tick)
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.history.fbo)
    gl.useProgram(this.copy.program)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, currentTex)
    gl.uniform1i(this.copy.loc.u_tex, 0)
    this.drawQuad(this.copy)

    // present
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, this.width, this.height)
    gl.useProgram(this.copy.program)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, currentTex)
    gl.uniform1i(this.copy.loc.u_tex, 0)
    this.drawQuad(this.copy)
  }

  dispose() {
    const gl = this.gl
    for (const t of this.targets) {
      gl.deleteFramebuffer(t.fbo)
      gl.deleteTexture(t.tex)
    }
    if (this.history) {
      gl.deleteFramebuffer(this.history.fbo)
      gl.deleteTexture(this.history.tex)
    }
    for (const p of this.programs.values()) gl.deleteProgram(p.program)
    gl.deleteProgram(this.copy.program)
    gl.deleteTexture(this.srcTex)
    gl.deleteBuffer(this.quad)
  }
}
