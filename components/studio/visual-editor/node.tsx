'use client'

import * as React from 'react'
import { type Node as NodeType } from '@/lib/glitch/graph-types'
import { useStudio } from '@/lib/store'
import { EFFECT_MAP } from '@/lib/glitch/effects'

interface NodeProps {
  data: NodeType
  onMove: (nodeId: string, position: { x: number; y: number }) => void
}

export default function Node({ data, onMove }: NodeProps) {
  const { selectNode, selectedNodeId } = useStudio()
  const isSelected = selectedNodeId === data.id
  const nodeRef = React.useRef<HTMLDivElement>(null)
  
  const nodeDef = EFFECT_MAP[data.type]

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    selectNode(data.id)
    
    const node = nodeRef.current
    if (!node) return

    const shiftX = e.clientX - node.getBoundingClientRect().left
    const shiftY = e.clientY - node.getBoundingClientRect().top
    
    const handlePointerMove = (e: PointerEvent) => {
      const parentRect = node.parentElement?.getBoundingClientRect()
      if (!parentRect) return
      
      let newX = e.clientX - parentRect.left - shiftX
      let newY = e.clientY - parentRect.top - shiftY

      // clamp position to parent
      newX = Math.max(0, Math.min(newX, parentRect.width - node.offsetWidth))
      newY = Math.max(0, Math.min(newY, parentRect.height - node.offsetHeight))
      
      onMove(data.id, { x: newX, y: newY })
    }

    const handlePointerUp = () => {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
  }

  return (
    <div
      ref={nodeRef}
      onPointerDown={handlePointerDown}
      className="absolute flex w-48 cursor-pointer flex-col rounded-md border bg-sidebar shadow-md"
      style={{
        left: data.position.x,
        top: data.position.y,
        borderColor: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))',
        boxShadow: isSelected ? `0 0 12px hsl(var(--primary) / 0.5)` : 'none'
      }}
    >
        <div className="rounded-t-md border-b border-border bg-background/50 px-3 py-1.5">
            <p className="text-xs font-medium">{nodeDef?.name ?? data.type}</p>
        </div>
        <div className="p-3">
            <p className="font-mono text-xs text-muted-foreground">ID: {data.id}</p>
        </div>
    </div>
  )
}
