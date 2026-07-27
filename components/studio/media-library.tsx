'use client'

import { Film, ImageIcon, MonitorUp, Radio, Upload, Webcam } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useStudio, type MediaItem } from '@/lib/store'

function sourceIcon(kind: MediaItem['kind']) {
  if (kind === 'signal') return Radio
  if (kind === 'image') return ImageIcon
  if (kind === 'video') return Film
  if (kind === 'webcam') return Webcam
  return MonitorUp
}

export function MediaLibrary() {
  const fileRef = useRef<HTMLInputElement>(null)
  const { media, activeMedia, setActiveMedia, addMedia } = useStudio()

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
      <div className="flex items-center justify-between px-3 py-2">
        <p className="panel-label">Input</p>
      </div>
      <ScrollArea className="min-h-0 flex-1 border-t border-border">
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

          <Separator className="my-2" />
          
          <p className="panel-label px-1 pb-1">Capture</p>
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
    </aside>
  )
}
