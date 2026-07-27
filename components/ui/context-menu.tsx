'use client'

import * as React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface ContextMenuItem {
  id: string
  label: string
  category: string
}

interface ContextMenuProps {
  items: ContextMenuItem[]
  position: { x: number; y: number }
  onItemClick: (item: ContextMenuItem) => void
  onClose: () => void
}

export function ContextMenu({ items, position, onItemClick, onClose }: ContextMenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  const categorizedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, ContextMenuItem[]>)

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-64 rounded-md border border-border bg-background/80 p-1 shadow-lg backdrop-blur-md"
      style={{ top: position.y, left: position.x }}
    >
      <ScrollArea className="max-h-96">
        <div className="flex flex-col p-1">
          {Object.entries(categorizedItems).map(([category, categoryItems]) => (
            <div key={category}>
              <p className="px-2 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {category}
              </p>
              {categoryItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className="w-full rounded-sm px-2 py-1.5 text-left text-sm text-foreground hover:bg-primary/10"
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
