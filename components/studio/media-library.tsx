'use client'

import { Film, ImageIcon, MonitorUp, Plus, Radio, Upload, Video, Webcam } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CATEGORY_LABELS, EFFECTS } from '@/lib/glitch/effects'
import { PRESETS } from '@/lib/glitch/presets'
import type { EffectCategory } from '@/lib/glitch/types'
import { useStudio, type MediaItem } from '@/lib/store'

const CATEGORY_ORDER: EffectCategory[] = ['temporal', 'compression', 'analog', 'distortion', 'optical', 'dither', 'color']

function sourceIcon(kind: MediaItem['kind']) {
  if (kind === 'signal') return Radio
  if (kind === 'image') return ImageIcon
  if (kind === 'video') return Film
  if (kind === 'webcam') return Webcam
  return MonitorUp
}

export function MediaLibrary() {
  const fileRef = useRef<HTMLInputElement>(null)
  const media = useStudio((s) => s.media)
  const activeMedia = useStudio((s) => s.activeMedia)
  const setActiveMedia = useStudio((s) => s.setActiveMedia)
  const addMedia = useStudio((s) => s.addMedia)
  const addEffect = useStudio((s) => s.addEffect)
  const loadPreset = useStudio((s) => s.loadPreset)
  const activePreset = useStudio((s) => s.activePreset)

  const onFiles = (files: FileList | null) => {
    if (!files) return
    for (const file of Array.from(files)) {
      const url = URL.createObjectURL(file)
      addMedia({
        id: `${file.name}-${Date.now()}`,
        kind: file.type.startsWith('video') ? 'video' : 'image',
        label: file.name.replace(/\.[^.]+$/, '').slice(0, 28),
        url,
      })
    }
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-sidebar">
      <Tabs defaultValue="source" className="flex min-h-0 flex-1 flex-col gap-0">
        <TabsList className="m-2 grid grid-cols-3 bg-muted/60">
          <TabsTrigger value="source" className="font-mono text-[10px] uppercase tracking-wider">
            Input
          </TabsTrigger>
          <TabsTrigger value="effects" className="font-mono text-[10px] uppercase tracking-wider">
            Effects
          </TabsTrigger>
          <TabsTrigger value="presets" className="font-mono text-[10px] uppercase tracking-wider">
            Looks
          </TabsTrigger>
        </TabsList>

        {/* ---------------------------------------------------------- sources */}
        <TabsContent value="source" className="min-h-0 flex-1">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-1 p-2">
              <p className="panel-label px-1 pb-1">Media</p>
              {media.map((item) => {
                const Icon = sourceIcon(item.kind)
                const active = activeMedia.id === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveMedia(item)}
                    className={`flex items-center gap-2 rounded px-2 py-2 text-left text-xs transition-colors ${
                      active
                        ? 'bg-primary/15 text-primary ring-1 ring-primary/40'
                        : 'text-foreground/80 hover:bg-muted/60'
                    }`}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                )
              })}

              <p className="panel-label px-1 pb-1 pt-3">Capture</p>
              <Button
                variant="secondary"
                size="sm"
                className="justify-start font-mono text-[11px]"
                onClick={() => setActiveMedia({ id: 'webcam', kind: 'webcam', label: 'Webcam' })}
              >
                <Webcam className="size-3.5" />
                Webcam
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="justify-start font-mono text-[11px]"
                onClick={() => setActiveMedia({ id: 'screen', kind: 'screen', label: 'Screen Capture' })}
              >
                <MonitorUp className="size-3.5" />
                Screen
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="justify-start font-mono text-[11px]"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="size-3.5" />
                Import file
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="video/*,image/*"
                multiple
                className="sr-only"
                onChange={(e) => onFiles(e.target.files)}
              />
              <p className="px-1 pt-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
                MP4 / WEBM / MOV / PNG / JPG / GIF. Files stay on your machine.
              </p>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ---------------------------------------------------------- effects */}
        <TabsContent value="effects" className="min-h-0 flex-1">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-3 p-2">
              {CATEGORY_ORDER.map((cat) => (
                <div key={cat} className="flex flex-col gap-1">
                  <p className="panel-label px-1">{CATEGORY_LABELS[cat]}</p>
                  {EFFECTS.filter((e) => e.category === cat).map((effect) => (
                    <button
                      key={effect.id}
                      type="button"
                      onClick={() => addEffect(effect.id)}
                      title={effect.blurb}
                      className="group flex items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs text-foreground/80 transition-colors hover:bg-muted/60 hover:text-primary"
                    >
                      <span className="truncate">{effect.name}</span>
                      <Plus className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ---------------------------------------------------------- presets */}
        <TabsContent value="presets" className="min-h-0 flex-1">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-1 p-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => loadPreset(preset.id)}
                  className={`flex flex-col gap-0.5 rounded px-2 py-2 text-left transition-colors ${
                    activePreset === preset.id
                      ? 'bg-primary/15 ring-1 ring-primary/40'
                      : 'hover:bg-muted/60'
                  }`}
                >
                  <span
                    className={`flex items-center gap-1.5 text-xs font-medium ${
                      activePreset === preset.id ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    <Video className="size-3" />
                    {preset.name}
                  </span>
                  <span className="text-[11px] leading-snug text-muted-foreground">{preset.blurb}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </aside>
  )
}
