'use client'

import { Camera, Circle, Expand, Pause, Play, Square } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AudioAnalyser } from '@/lib/glitch/audio'
import { GlitchRenderer } from '@/lib/glitch/renderer'
import { SignalSource } from '@/lib/glitch/signal'
import { useStudio } from '@/lib/store'

export function Viewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const rendererRef = useRef<GlitchRenderer | null>(null)
  const signalRef = useRef<SignalSource | null>(null)
  const analyserRef = useRef<AudioAnalyser | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [fps, setFps] = useState(0)
  const [recording, setRecording] = useState(false)
  const [recSeconds, setRecSeconds] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const activeMedia = useStudio((s) => s.activeMedia)
  const playing = useStudio((s) => s.playing)
  const togglePlaying = useStudio((s) => s.togglePlaying)
  const audioReactive = useStudio((s) => s.audioReactive)
  const setAudioReactive = useStudio((s) => s.setAudioReactive)
  const setAudioLevel = useStudio((s) => s.setAudioLevel)
  const activeCount = useStudio((s) => s.chain.filter((n) => n.enabled).length)

  /* ------------------------------------------------------------- engine boot */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let renderer: GlitchRenderer
    try {
      renderer = new GlitchRenderer(canvas)
    } catch {
      setError('WebGL is not available in this browser.')
      return
    }
    rendererRef.current = renderer
    signalRef.current = new SignalSource(1280, 720)

    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect
      if (!box) return
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
      renderer.resize(box.width * dpr, box.height * dpr)
    })
    if (shellRef.current) observer.observe(shellRef.current)

    let raf = 0
    let last = performance.now()
    let acc = 0
    let frames = 0

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      const state = useStudio.getState()

      if (state.playing) renderer.time += dt
      renderer.seed = state.seed
      renderer.randomMode = state.randomMode

      const analyser = analyserRef.current
      if (analyser) {
        analyser.update()
        renderer.audioLevel = analyser.level
      } else {
        renderer.audioLevel = 0
      }

      if (state.activeMedia.kind === 'signal' && signalRef.current) {
        signalRef.current.draw(renderer.time, renderer.audioLevel)
      }
      renderer.render(state.chain, now)

      frames += 1
      acc += dt
      if (acc >= 0.5) {
        setFps(Math.round(frames / acc))
        if (analyser) setAudioLevel(analyser.level)
        frames = 0
        acc = 0
      }
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      renderer.dispose()
      rendererRef.current = null
    }
  }, [setAudioLevel])

  /* ------------------------------------------------------------ source swap */
  useEffect(() => {
    const renderer = rendererRef.current
    const video = videoRef.current
    if (!renderer || !video) return
    let cancelled = false
    setError(null)

    const stopTracks = () => {
      const s = video.srcObject as MediaStream | null
      s?.getTracks().forEach((t) => t.stop())
      video.srcObject = null
    }

    const run = async () => {
      stopTracks()
      video.removeAttribute('src')

      if (activeMedia.kind === 'signal') {
        renderer.setSource(signalRef.current?.canvas ?? null)
        return
      }

      if (activeMedia.kind === 'image' && activeMedia.url) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = activeMedia.url
        try {
          await img.decode()
        } catch {
          /* fall through, texture upload will retry */
        }
        if (!cancelled) renderer.setSource(img)
        return
      }

      if (activeMedia.kind === 'video' && activeMedia.url) {
        video.src = activeMedia.url
        video.loop = true
        video.muted = true
        try {
          await video.play()
        } catch {
          setError('Click play to start this clip.')
        }
        if (!cancelled) renderer.setSource(video)
        return
      }

      try {
        const stream =
          activeMedia.kind === 'webcam'
            ? await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false })
            : await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        video.srcObject = stream
        video.muted = true
        await video.play()
        renderer.setSource(video)
      } catch {
        setError(activeMedia.kind === 'webcam' ? 'Camera access was blocked.' : 'Screen capture was cancelled.')
        renderer.setSource(signalRef.current?.canvas ?? null)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [activeMedia])

  /* --------------------------------------------------------- audio reactive */
  useEffect(() => {
    if (!audioReactive) {
      analyserRef.current?.stop()
      analyserRef.current = null
      setAudioLevel(0)
      return
    }
    const analyser = new AudioAnalyser()
    analyser
      .start()
      .then(() => {
        analyserRef.current = analyser
      })
      .catch(() => {
        setError('Microphone access was blocked.')
        setAudioReactive(false)
      })
    return () => {
      analyser.stop()
      analyserRef.current = null
    }
  }, [audioReactive, setAudioLevel, setAudioReactive])

  /* ------------------------------------------------------------- pause media */
  useEffect(() => {
    const video = videoRef.current
    if (!video || !video.src) return
    if (playing) void video.play().catch(() => {})
    else video.pause()
  }, [playing])

  /* ---------------------------------------------------------------- capture */
  const snapshot = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `glitchstudio-${Date.now()}.png`
    a.click()
  }, [])

  const toggleRecording = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (recorderRef.current) {
      recorderRef.current.stop()
      return
    }
    const stream = canvas.captureStream(30)
    streamRef.current = stream
    const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((m) =>
      MediaRecorder.isTypeSupported(m),
    )
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12_000_000 })
    const chunks: Blob[] = []
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `glitchstudio-${Date.now()}.webm`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 4000)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      recorderRef.current = null
      setRecording(false)
      setRecSeconds(0)
    }
    recorder.start(200)
    recorderRef.current = recorder
    setRecording(true)
  }, [])

  useEffect(() => {
    if (!recording) return
    const id = setInterval(() => setRecSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [recording])

  const goFullscreen = () => {
    void shellRef.current?.requestFullscreen?.()
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3 p-3">
      <div
        ref={shellRef}
        className="checker relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded border border-border bg-background"
      >
        <canvas ref={canvasRef} className="h-full w-full" aria-label="Glitch render output" />
        <video ref={videoRef} playsInline muted className="sr-only" aria-hidden="true" />

        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-primary/90">
          <span className="rounded bg-background/70 px-2 py-1 backdrop-blur">{activeMedia.label}</span>
          <span className="rounded bg-background/70 px-2 py-1 backdrop-blur">{activeCount} stages</span>
          <span className="rounded bg-background/70 px-2 py-1 backdrop-blur">{fps} fps</span>
        </div>

        {recording && (
          <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-2 rounded bg-background/70 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-accent backdrop-blur">
            <Circle className="size-2 animate-pulse fill-current" />
            REC {String(Math.floor(recSeconds / 60)).padStart(2, '0')}:{String(recSeconds % 60).padStart(2, '0')}
          </div>
        )}

        {error && (
          <p className="absolute bottom-3 left-3 rounded bg-background/85 px-2 py-1 font-mono text-[10px] text-accent backdrop-blur">
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={togglePlaying} className="font-mono text-xs">
          {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          {playing ? 'Pause' : 'Run'}
        </Button>
        <Button
          variant={recording ? 'default' : 'secondary'}
          size="sm"
          onClick={toggleRecording}
          className="font-mono text-xs"
        >
          {recording ? <Square className="size-3.5" /> : <Circle className="size-3.5" />}
          {recording ? 'Stop & Save' : 'Record WEBM'}
        </Button>
        <Button variant="secondary" size="sm" onClick={snapshot} className="font-mono text-xs">
          <Camera className="size-3.5" />
          Frame PNG
        </Button>
        <Button variant="ghost" size="sm" onClick={goFullscreen} className="font-mono text-xs">
          <Expand className="size-3.5" />
          Live
        </Button>
      </div>
    </section>
  )
}
