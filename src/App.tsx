import { useEffect, useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useTreeEditor, type TreeEditor } from '@/hooks/useTreeEditor'
import Toolbar from '@/features/toolbar/Toolbar'
import LeftSidebar from '@/features/sidebar/LeftSidebar'
import TreeCanvas from '@/features/canvas/TreeCanvas'
import PropertiesPanel from '@/features/properties/PropertiesPanel'
import { Toaster } from '@/components/ui/Toaster'
import { cn } from '@/lib/utils'

function EditorShell() {
  const editor: TreeEditor = useTreeEditor()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)

  /* ---------------- keyboard shortcuts ---------------- */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      const typing =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable

      if (event.key === 'Escape') {
        editor.clearSelection()
        ;(document.activeElement as HTMLElement | null)?.blur()
        return
      }
      if (typing) return

      const mod = event.ctrlKey || event.metaKey
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        editor.deleteSelected()
      } else if (mod && !event.shiftKey && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        editor.undo()
      } else if (
        (mod && event.shiftKey && event.key.toLowerCase() === 'z') ||
        (mod && event.key.toLowerCase() === 'y')
      ) {
        event.preventDefault()
        editor.redo()
      } else if (mod && event.key.toLowerCase() === 'c') {
        editor.copySelected()
      } else if (mod && event.key.toLowerCase() === 'v') {
        event.preventDefault()
        editor.pasteClipboard()
      } else if (mod && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        editor.duplicateSelected()
      } else if (mod && event.key.toLowerCase() === 'a') {
        event.preventDefault()
        editor.selectAll()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [editor])

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <Toolbar
        editor={editor}
        onOpenSidebar={() => setSidebarOpen(true)}
        onOpenPanel={() => setPanelOpen(true)}
      />

      <div className="relative flex min-h-0 flex-1">
        {/* left sidebar — drawer on small screens */}
        <div
          className={cn(
            'z-40 lg:static lg:z-auto',
            sidebarOpen
              ? 'absolute inset-y-0 left-0 shadow-[var(--shadow-lg-soft)]'
              : 'hidden lg:block',
          )}
        >
          <LeftSidebar
            editor={editor}
            onClose={sidebarOpen ? () => setSidebarOpen(false) : undefined}
          />
        </div>

        {/* main canvas */}
        <main className="min-w-0 flex-1">
          <TreeCanvas editor={editor} />
        </main>

        {/* properties panel — drawer on small screens */}
        <div
          className={cn(
            'z-40 lg:static lg:z-auto',
            panelOpen
              ? 'absolute inset-y-0 right-0 shadow-[var(--shadow-lg-soft)]'
              : 'hidden lg:block',
          )}
        >
          <PropertiesPanel
            editor={editor}
            onClose={panelOpen ? () => setPanelOpen(false) : undefined}
          />
        </div>
      </div>

      <Toaster toasts={editor.toasts} />
    </div>
  )
}

function App() {
  return (
    <ReactFlowProvider>
      <EditorShell />
    </ReactFlowProvider>
  )
}

export default App
