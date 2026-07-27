'use client'

import { ArrowDown, ArrowUp, Eye, EyeOff, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { EFFECT_MAP } from '@/lib/glitch/effects'
import { useStudio } from '@/lib/store'

function ParamSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  const digits = step < 0.01 ? 3 : step < 1 ? 2 : 0
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <Label className="text-[11px] font-normal text-muted-foreground">{label}</Label>
        <span className="font-mono text-[11px] text-primary">{value.toFixed(digits)}</span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} />
    </div>
  )
}

export function Inspector() {
  const chain = useStudio((s) => s.chain)
  const selectedId = useStudio((s) => s.selectedId)
  const selectNode = useStudio((s) => s.selectNode)
  const toggleNode = useStudio((s) => s.toggleNode)
  const removeNode = useStudio((s) => s.removeNode)
  const moveNode = useStudio((s) => s.moveNode)
  const updateParam = useStudio((s) => s.updateParam)
  const updateNode = useStudio((s) => s.updateNode)
  const clearChain = useStudio((s) => s.clearChain)

  const selected = chain.find((n) => n.id === selectedId) ?? null
  const def = selected ? EFFECT_MAP[selected.effect] : null

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-sidebar">
      <div className="flex items-center justify-between px-3 py-2">
        <p className="panel-label">Signal Chain</p>
        <button
          type="button"
          onClick={clearChain}
          className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-accent"
        >
          Clear
        </button>
      </div>

      <ScrollArea className="max-h-[45%] shrink-0 border-y border-border">
        <ol className="flex flex-col p-2">
          {chain.length === 0 && (
            <li className="px-1 py-6 text-center font-mono text-[11px] text-muted-foreground">
              Chain empty — add stages from the Effects tab.
            </li>
          )}
          {chain.map((node, i) => {
            const nodeDef = EFFECT_MAP[node.effect]
            const active = node.id === selectedId
            return (
              <li key={node.id}>
                <div
                  className={`group flex items-center gap-1 rounded px-1.5 py-1.5 ${
                    active ? 'bg-primary/15 ring-1 ring-primary/40' : 'hover:bg-muted/50'
                  }`}
                >
                  <span className="w-4 shrink-0 font-mono text-[10px] text-muted-foreground">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <button
                    type="button"
                    onClick={() => selectNode(node.id)}
                    className="flex min-w-0 flex-1 flex-col items-start"
                  >
                    <span
                      className={`truncate text-xs ${
                        node.enabled ? (active ? 'text-primary' : 'text-foreground') : 'text-muted-foreground line-through'
                      }`}
                    >
                      {nodeDef?.name ?? node.effect}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      mix {Math.round(node.intensity * 100)}%{node.audioMod > 0 ? ` · aud ${Math.round(node.audioMod * 100)}%` : ''}
                    </span>
                  </button>
                  <div className="flex shrink-0 items-center opacity-60 transition-opacity group-hover:opacity-100">
                    <Button variant="ghost" size="icon" className="size-6" onClick={() => moveNode(node.id, -1)}>
                      <ArrowUp className="size-3" />
                      <span className="sr-only">Move up</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="size-6" onClick={() => moveNode(node.id, 1)}>
                      <ArrowDown className="size-3" />
                      <span className="sr-only">Move down</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="size-6" onClick={() => toggleNode(node.id)}>
                      {node.enabled ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                      <span className="sr-only">Toggle stage</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="size-6" onClick={() => removeNode(node.id)}>
                      <Trash2 className="size-3" />
                      <span className="sr-only">Remove stage</span>
                    </Button>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </ScrollArea>

      <ScrollArea className="min-h-0 flex-1">
        {selected && def ? (
          <div className="flex flex-col gap-4 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-medium text-foreground">{def.name}</h2>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{def.blurb}</p>
              </div>
              <Button variant="ghost" size="icon" className="size-6" onClick={() => selectNode(null)}>
                <X className="size-3" />
                <span className="sr-only">Deselect</span>
              </Button>
            </div>

            <div className="flex flex-col gap-3 rounded border border-border bg-card/60 p-3">
              <ParamSlider
                label="Stage Mix"
                value={selected.intensity}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => updateNode(selected.id, { intensity: v })}
              />
              <ParamSlider
                label="Audio Drive"
                value={selected.audioMod}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => updateNode(selected.id, { audioMod: v })}
              />
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
              <p className="panel-label">Parameters</p>
              {def.params.map((p) => (
                <ParamSlider
                  key={p.key}
                  label={p.label}
                  value={selected.params[p.key] ?? p.default}
                  min={p.min}
                  max={p.max}
                  step={p.step}
                  onChange={(v) => updateParam(selected.id, p.key, v)}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="p-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
            Select a stage to edit its parameters. Stages run top to bottom; the last one is what you see.
          </p>
        )}
      </ScrollArea>
    </aside>
  )
}
