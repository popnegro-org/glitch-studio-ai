/**
 * Procedural "test signal" source. Gives the engine something alive to chew on
 * when no media is loaded, drawn on a 2D canvas that is uploaded every frame.
 */
export class SignalSource {
  readonly canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor(width = 1280, height = 720) {
    this.canvas = document.createElement('canvas')
    this.canvas.width = width
    this.canvas.height = height
    this.ctx = this.canvas.getContext('2d')!
  }

  draw(t: number, level = 0) {
    const { canvas: c, ctx } = this
    const w = c.width
    const h = c.height
    const horizon = h * 0.62

    ctx.fillStyle = '#05070b'
    ctx.fillRect(0, 0, w, h)

    // sun disc
    const sunR = h * (0.17 + level * 0.05)
    const grad = ctx.createLinearGradient(0, horizon - sunR, 0, horizon + sunR * 0.2)
    grad.addColorStop(0, '#7ff3ff')
    grad.addColorStop(0.6, '#1d9fb8')
    grad.addColorStop(1, '#0b2b3a')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(w / 2, horizon - sunR * 0.15, sunR, 0, Math.PI * 2)
    ctx.fill()

    // slats over the sun
    ctx.fillStyle = '#05070b'
    for (let i = 0; i < 9; i++) {
      const y = horizon - sunR * 1.2 + i * (sunR * 0.28)
      ctx.fillRect(w / 2 - sunR, y + Math.sin(t + i) * 2, sunR * 2, sunR * 0.09 + i * 0.9)
    }

    // perspective floor grid
    ctx.strokeStyle = 'rgba(120,240,255,0.55)'
    ctx.lineWidth = 2
    for (let i = -14; i <= 14; i++) {
      ctx.beginPath()
      ctx.moveTo(w / 2 + i * (w * 0.032), horizon)
      ctx.lineTo(w / 2 + i * (w * 0.34), h)
      ctx.stroke()
    }
    const scroll = (t * 0.35) % 1
    for (let i = 0; i < 16; i++) {
      const f = (i + scroll) / 16
      const y = horizon + Math.pow(f, 3) * (h - horizon)
      ctx.globalAlpha = 0.15 + f * 0.6
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    // drifting wireframe monolith
    const cx = w / 2 + Math.sin(t * 0.4) * w * 0.18
    const bw = w * 0.1
    const bh = h * (0.26 + level * 0.12)
    ctx.strokeStyle = 'rgba(255,90,190,0.8)'
    ctx.lineWidth = 3
    ctx.strokeRect(cx - bw / 2, horizon - bh, bw, bh)
    ctx.beginPath()
    ctx.moveTo(cx - bw / 2, horizon - bh)
    ctx.lineTo(cx + bw / 2, horizon)
    ctx.moveTo(cx + bw / 2, horizon - bh)
    ctx.lineTo(cx - bw / 2, horizon)
    ctx.stroke()

    // colour bars strip
    const bars = ['#e6e6e6', '#d8d800', '#00d8d8', '#00d800', '#d800d8', '#d80000', '#0000d8']
    const bwid = w / bars.length
    bars.forEach((col, i) => {
      ctx.globalAlpha = 0.75
      ctx.fillStyle = col
      ctx.fillRect(i * bwid, 0, bwid, h * 0.055)
    })
    ctx.globalAlpha = 1

    // timecode + status text
    const frames = Math.floor(t * 25) % 25
    const secs = Math.floor(t) % 60
    const mins = Math.floor(t / 60) % 60
    const tc = `00:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`
    ctx.font = `${Math.round(h * 0.055)}px ui-monospace, monospace`
    ctx.fillStyle = 'rgba(230,255,255,0.9)'
    ctx.fillText(tc, w * 0.04, h * 0.16)
    ctx.font = `${Math.round(h * 0.032)}px ui-monospace, monospace`
    ctx.fillStyle = 'rgba(255,90,190,0.9)'
    ctx.fillText('REC  SIGNAL/GEN  NO INPUT', w * 0.04, h * 0.21)

    // audio meter
    const meterW = w * 0.22
    ctx.strokeStyle = 'rgba(230,255,255,0.4)'
    ctx.lineWidth = 1
    ctx.strokeRect(w * 0.74, h * 0.11, meterW, h * 0.03)
    ctx.fillStyle = 'rgba(120,240,255,0.85)'
    ctx.fillRect(w * 0.74, h * 0.11, meterW * Math.min(1, level * 1.6), h * 0.03)
  }
}
