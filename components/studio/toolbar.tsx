'use client'

import { Dices, Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useStudio } from '@/lib/store'
import type { RandomMode } from '@/lib/glitch/types'

const SUGGESTIONS = [
  'a memory found on a damaged hard drive',
  'a broadcast from a city that no longer exists',
  'sunlight through a dying CRT',
  'the last frame before the tape snapped',
]

export function Toolbar() {
  const [prompt, setPrompt] = useState('')
  const seed = useStudio((s) => s.seed)
  const setSeed = useStudio((s) => s.setSeed)
  const rollSeed = useStudio((s) => s.rollSeed)
  const randomMode = useStudio((s) => s.randomMode)
  const setRandomMode = useStudio((s) => s.setRandomMode)
  const audioReactive = useStudio((s) => s.audioReactive)
  const setAudioReactive = useStudio((s) => s.setAudioReactive)
  const audioLevel = useStudio((s) => s.audioLevel)
  const applyStages = useStudio((s) => s.applyStages)
  const aiStatus = useStudio((s) => s.aiStatus)
  const aiNote = useStudio((s) => s.aiNote)
  const setAiStatus = useStudio((s) => s.setAiStatus)

  const thinking = aiStatus === 'thinking'

  const generate = async (text: string) => {
    if (!text.trim() || thinking) return
    setAiStatus('thinking', null)
    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      })
      const data = (await res.json()) as {
        title?: string
        note?: string
        stages?: unknown[]
        error?: string
      }
      if (!res.ok || !data.stages) {
        setAiStatus('error', data.error ?? 'Pipeline generation failed. Build the chain by hand instead.')
        return
      }
      applyStages(data.stages as never, `${data.title} — ${data.note}`)
      setAiStatus('idle')
    } catch {
      setAiStatus('error', 'Network error reaching the pipeline designer. Try again.')
    }
  }

  return (
    <header className="flex shrink-0 flex-col gap-2 border-b border-border bg-sidebar px-3 py-2">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-baseline gap-2">
          <span className="glitch-mark text-sm font-semibold tracking-[0.2em] text-primary" data-text="GLITCHSTUDIO">
            GLITCHSTUDIO
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground sm:inline">
            realtime decay lab
          </span>
        </div>

        <form
          className="flex min-w-64 flex-1 items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void generate(prompt)
          }}
        >
          <div className="relative flex-1">
            <Sparkles className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-primary/70" />
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe a look — the model designs the effect chain"
              className="h-8 bg-input pl-8 font-mono text-xs"
              aria-label="Describe the look you want"
            />
          </div>
          <Button type="submit" size="sm" disabled={thinking || !prompt.trim()} className="h-8 font-mono text-xs">
            {thinking ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            {thinking ? 'Designing' : 'Generate'}
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Seed</span>
            <Input
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value) || 0)}
              className="h-8 w-20 bg-input font-mono text-xs"
            />
          </label>
          <Button variant="secondary" size="icon" className="size-8" onClick={rollSeed}>
            <Dices className="size-3.5" />
            <span className="sr-only">Randomize seed</span>
          </Button>

          <Select value={randomMode} onValueChange={(v) => setRandomMode(v as RandomMode)}>
            <SelectTrigger size="sm" className="h-8 w-32 bg-input font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deterministic" className="font-mono text-xs">
                Deterministic
              </SelectItem>
              <SelectItem value="semi" className="font-mono text-xs">
                Semi-random
              </SelectItem>
              <SelectItem value="chaos" className="font-mono text-xs">
                Chaos
              </SelectItem>
            </SelectContent>
          </Select>

          <label className="flex items-center gap-2">
            <Switch checked={audioReactive} onCheckedChange={setAudioReactive} />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Audio</span>
            <span
              className="h-1.5 w-10 overflow-hidden rounded-full bg-muted"
              role="meter"
              aria-label="Live audio level"
            >
              <span
                className="block h-full bg-accent transition-[width] duration-100"
                style={{ width: `${Math.min(audioLevel * 140, 100)}%` }}
              />
            </span>
          </label>
        </div>
      </div>

      {aiNote && (
        <div className="flex items-start gap-2">
          <p
            className={`flex-1 font-mono text-[10px] leading-relaxed ${
              aiStatus === 'error' ? 'text-accent' : 'text-muted-foreground'
            }`}
          >
            {aiNote}
          </p>
          <button
            type="button"
            onClick={() => setAiStatus('idle', null)}
            className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary"
          >
            Dismiss
          </button>
        </div>
      )}

      {!aiNote && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Try</span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setPrompt(s)
                void generate(s)
              }}
              className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </header>
  )
}
