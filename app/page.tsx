import { Inspector } from '@/components/studio/inspector'
import { MediaLibrary } from '@/components/studio/media-library'
import { Toolbar } from '@/components/studio/toolbar'
import { Viewport } from '@/components/studio/viewport'

export default function StudioPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden font-sans">
      <Toolbar />
      <main className="flex min-h-0 flex-1">
        <MediaLibrary />
        <Viewport />
        <Inspector />
      </main>
    </div>
  )
}
