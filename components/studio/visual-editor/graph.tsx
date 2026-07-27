'use client'

import * as React from 'react'
import { useStudio } from '@/lib/store'
import Node from './node'
import { ContextMenu, type ContextMenuItem } from '@/components/ui/context-menu'
import { CATEGORY_LABELS, EFFECTS, defaultParams } from '@/lib/glitch/effects'
import { type Node as NodeType } from '@/lib/glitch/graph-types'
import { nanoid } from 'nanoid'

export default function Graph() {
  const { graph, addNode, moveNode, selectNode } = useStudio()
  const [menu, setMenu] = React.useState<{ x: number; y: number } | null>(null)
  const graphRef = React.useRef<HTMLDivElement>(null)

  const effectItems: ContextMenuItem[] = React.useMemo(
    () =>
      EFFECTS.map((effect) => ({
        id: effect.id,
        label: effect.name,
        category: CATEGORY_LABELS[effect.category] ?? 'Misc',
      })),
    [],
  )

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY })
  }

  const handleAddNode = (item: ContextMenuItem) => {
    const graphRect = graphRef.current?.getBoundingClientRect()
    if (!graphRect || !menu) return

    const newNode: NodeType = {
      id: nanoid(10),
      type: item.id,
      position: {
        x: menu.x - graphRect.left,
        y: menu.y - graphRect.top,
      },
      enabled: true,
      intensity: 0.8,
      audioMod: 0,
      params: defaultParams(item.id),
    }
    addNode(newNode)
    setMenu(null)
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    // Deselect node if clicking on the graph background
    if (e.target === e.currentTarget) {
        selectNode(null)
    }
    setMenu(null)
  }

  return (
    <div
      ref={graphRef}
      className="h-full w-full"
      style={{ position: 'relative' }}
      onContextMenu={handleContextMenu}
      onPointerDown={handlePointerDown}
    >
      {graph.nodes.map((node) => (
        <Node key={node.id} data={node} onMove={moveNode} />
      ))}
      
      {menu && <ContextMenu items={effectItems} position={menu} onItemClick={handleAddNode} onClose={() => setMenu(null)} />}
    </div>
  )
}
