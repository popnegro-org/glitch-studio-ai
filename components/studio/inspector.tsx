'use client'

import { Eye, EyeOff, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
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
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
      />
    </div>
  )
}

export function Inspector() {
  const { graph, selectedNodeId, selectNode, updateNode, removeNode } = useStudio()

  const selectedNode = graph.nodes.find((n) => n.id === selectedNodeId) ?? null
  const nodeDef = selectedNode ? EFFECT_MAP[selectedNode.type] : null

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-sidebar">
      <div className="flex items-center justify-between px-3 py-2">
        <p className="panel-label">Inspector</p>
        {selectedNode && (
            <Button variant="ghost" size="icon" className="size-6" onClick={() => selectNode(null)}>
              <X className="size-3" />
              <span className="sr-only">Deselect</span>
            </Button>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1 border-t border-border">
        {selectedNode && nodeDef ? (
          <div className="flex flex-col gap-4 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-medium text-foreground">{nodeDef.name}</h2>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{nodeDef.blurb}</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                    checked={selectedNode.enabled}
                    onCheckedChange={(enabled) => updateNode(selectedNode.id, { enabled })}
                    aria-label="Toggle Node"
                />
                <Button variant="ghost" size="icon" className="size-6" onClick={() => removeNode(selectedNode.id)}>
                  <Trash2 className="size-3 text-accent" />
                  <span className="sr-only">Remove Node</span>
                </Button>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
              <p className="panel-label">Core</p>
                <ParamSlider
                    label="Intensity"
                    value={selectedNode.intensity ?? 1}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(intensity) => updateNode(selectedNode.id, { intensity })}
                />
                <ParamSlider
                    label="Audio Drive"
                    value={selectedNode.audioMod ?? 0}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(audioMod) => updateNode(selectedNode.id, { audioMod })}
                />
            </div>

            {nodeDef.params.length > 0 && <Separator />}

            {nodeDef.params.length > 0 && (
                <div className="flex flex-col gap-3">
                    <p className="panel-label">Parameters</p>
                    {nodeDef.params.map((p) => (
                        <ParamSlider
                        key={p.key}
                        label={p.label}
                        value={selectedNode.params?.[p.key] ?? p.default}
                        min={p.min}
                        max={p.max}
                        step={p.step}
                        onChange={(v) => {
                            const params = { ...selectedNode.params, [p.key]: v };
                            updateNode(selectedNode.id, { params });
                        }}
                        />
                    ))}
                </div>
            )}
          </div>
        ) : (
          <p className="p-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
            Select a node in the editor to view its properties.
          </p>
        )}
      </ScrollArea>
    </aside>
  )
}
