/** Minimal FFT analyser used to drive audio-reactive stage mixes. */
export class AudioAnalyser {
  private ctx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private data: Uint8Array<ArrayBuffer> | null = null
  private stream: MediaStream | null = null

  level = 0
  low = 0
  high = 0

  async start(source?: MediaStream | HTMLMediaElement) {
    this.stop()
    const AC: typeof AudioContext =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AC()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 1024
    analyser.smoothingTimeConstant = 0.7

    let node: AudioNode
    if (source instanceof MediaStream) {
      this.stream = source
      node = ctx.createMediaStreamSource(source)
    } else if (source) {
      node = ctx.createMediaElementSource(source)
      node.connect(ctx.destination)
    } else {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.stream = mic
      node = ctx.createMediaStreamSource(mic)
    }
    node.connect(analyser)
    this.ctx = ctx
    this.analyser = analyser
    this.data = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount))
    await ctx.resume()
  }

  update() {
    if (!this.analyser || !this.data) return
    this.analyser.getByteFrequencyData(this.data)
    const n = this.data.length
    let sum = 0
    let low = 0
    let high = 0
    const lowEnd = Math.floor(n * 0.08)
    for (let i = 0; i < n; i++) {
      const v = this.data[i] / 255
      sum += v
      if (i < lowEnd) low += v
      else if (i > n * 0.5) high += v
    }
    const target = sum / n
    // asymmetric smoothing: snap up on transients, fall away slowly
    this.level = target > this.level ? this.level + (target - this.level) * 0.6 : this.level * 0.9
    this.low = low / Math.max(lowEnd, 1)
    this.high = high / Math.max(n * 0.5, 1)
  }

  stop() {
    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null
    void this.ctx?.close()
    this.ctx = null
    this.analyser = null
    this.data = null
    this.level = 0
  }
}
