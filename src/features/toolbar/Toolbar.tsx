import { useRef, useState } from 'react'
import {
  Download,
  FileJson,
  FilePlus2,
  Image as ImageIcon,
  Layout,
  Maximize,
  Monitor,
  Moon,
  PanelLeft,
  PanelRight,
  Pencil,
  Redo2,
  Save,
  Search,
  Settings,
  Sun,
  Trash2,
  Undo2,
  Upload,
  Wand2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { Button, IconButton, Input } from '@/components/ui/primitives'
import {
  DropdownMenu,
  MenuItem,
  MenuLabel,
  MenuSeparator,
} from '@/components/ui/DropdownMenu'
import { Dialog, ConfirmDialog } from '@/components/ui/Dialog'
import { STORAGE_KEY, type TreeEditor } from '@/hooks/useTreeEditor'
import { serializeProject, parseImportedProject, saveProject, loadProject } from '@/lib/project'
import { exportImage } from '@/lib/exportImage'
import { createDemoTree } from '@/data/templates'
import type { LayoutDirection } from '@/types'
import { cn } from '@/lib/utils'

const LAYOUT_LABELS: Record<LayoutDirection, string> = {
  TB: 'Top → Bottom',
  BT: 'Bottom → Top',
  LR: 'Left → Right',
  RL: 'Right → Left',
}

interface ToolbarProps {
  editor: TreeEditor
  onOpenSidebar: () => void
  onOpenPanel: () => void
}

function Toolbar({ editor, onOpenSidebar, onOpenPanel }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState(editor.name)
  const [confirm, setConfirm] = useState<'new' | 'clear' | 'demo' | null>(null)
  const [search, setSearch] = useState('')

  /* ---------------- actions ---------------- */
  async function loadProjectFile() {
    try {
      const ok = await loadProject((project) => {
        if (!project) {
          editor.toast("Could not load that file", "error")
          return
        }
        editor.replaceProject(project)
        editor.toast("Project loaded", "success")
      })
      if (!ok) {
        // Fallback: the hidden file input will be used by the Import Project button.
        editor.toast("Open a .nodetree file via Import Project", "info")
      }
    } catch {
      editor.toast("Open a .nodetree file via Import Project", "info")
    }
  }

  async function save() {
    const project = {
      name: editor.name,
      version: 1 as const,
      nodes: editor.nodes,
      edges: editor.edges,
      settings: editor.settings,
    }
    // Keep the existing autosave/recovery in localStorage.
    localStorage.setItem(STORAGE_KEY, serializeProject(project))
    // Also persist a real .nodetree file when the browser supports it.
    try {
      const ok = await saveProject(project, editor.name)
      if (ok) {
        editor.toast("Project saved", "success")
      } else {
        editor.toast("Project autosaved in browser", "info")
      }
    } catch {
      editor.toast("Project autosaved in browser", "info")
    }
  }

  async function exportAs(format: 'json' | 'png' | 'svg') {
    try {
      if (format === 'json') {
        serializeAndDownload()
      } else {
        await exportImage(editor.visibleDoc.visibleNodes, format)
        editor.toast(`Exported as ${format.toUpperCase()}`, 'success')
      }
    } catch (error) {
      editor.toast(error instanceof Error ? error.message : 'Export failed', 'error')
    }
  }

  function serializeAndDownload() {
    const text = serializeProject({
      name: editor.name,
      version: 1,
      nodes: editor.nodes,
      edges: editor.edges,
      settings: editor.settings,
    })
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${editor.name.replace(/\s+/g, '-').toLowerCase()}.json`
    link.click()
    URL.revokeObjectURL(url)
    editor.toast('Exported JSON', 'success')
  }

  function handleImportFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const project = parseImportedProject(String(reader.result))
      if (!project) {
        editor.toast('Invalid project file', 'error')
        return
      }
      editor.replaceProject(project)
      editor.toast('Project imported', 'success')
    }
    reader.readAsText(file)
  }

  function runSearch(value: string) {
    setSearch(value)
    editor.highlightSearch(value)
  }

  const cycleTheme = () =>
    editor.setTheme(editor.theme === 'dark' ? 'light' : 'dark')

  return (
    <header className="relative z-40 flex h-14 shrink-0 items-center gap-2 border-b border-[var(--border)] bg-[var(--card)] px-3">
      {/* ---------- left: brand + project ---------- */}
      <div className="flex min-w-0 items-center gap-2.5">
        <IconButton
          label="Open nodes panel"
          className="lg:hidden"
          onClick={onOpenSidebar}
        >
          <PanelLeft size={17} />
        </IconButton>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[var(--shadow-sm-soft)]">
          <Layout size={17} />
        </div>
        <div className="hidden min-w-0 sm:block">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-[var(--foreground)]">
              NodeTree
            </span>
            <span
              title={editor.dirty ? 'Unsaved changes (auto-saving…)' : 'All changes saved'}
              className={cn(
                'size-1.5 rounded-full',
                editor.dirty ? 'bg-amber-400' : 'bg-[var(--primary)]',
              )}
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="max-w-44 truncate text-[11px] text-[var(--muted-foreground)]">
              {editor.name}
            </span>
            <button
              type="button"
              aria-label="Rename project"
              className="rounded p-0.5 text-[var(--muted-foreground)] transition hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
              onClick={() => {
                setRenameValue(editor.name)
                setRenameOpen(true)
              }}
            >
              <Pencil size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* ---------- center: history / zoom / layout ---------- */}
      <div className="mx-auto hidden items-center gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--background)] p-1 md:flex">
        <IconButton label="Undo (Ctrl+Z)" disabled={!editor.canUndo} onClick={editor.undo}>
          <Undo2 size={16} />
        </IconButton>
        <IconButton label="Redo (Ctrl+Shift+Z)" disabled={!editor.canRedo} onClick={editor.redo}>
          <Redo2 size={16} />
        </IconButton>
        <span className="mx-1 h-5 w-px bg-[var(--border)]" />
        <IconButton label="Zoom In" onClick={editor.zoomIn}>
          <ZoomIn size={16} />
        </IconButton>
        <IconButton label="Zoom Out" onClick={editor.zoomOut}>
          <ZoomOut size={16} />
        </IconButton>
        <IconButton label="Fit View" onClick={editor.fitView}>
          <Maximize size={16} />
        </IconButton>
        <span className="mx-1 h-5 w-px bg-[var(--border)]" />
        <IconButton
          label={`Auto Layout (${LAYOUT_LABELS[editor.settings.layoutDirection]})`}
          onClick={() => editor.applyAutoLayout()}
        >
          <Wand2 size={16} />
        </IconButton>
      </div>

      {/* ---------- right: search + file actions ---------- */}
      <div className="ml-auto flex items-center gap-1.5">
        <div className="relative hidden sm:block">
          <Search
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
          />
          <Input
            value={search}
            onChange={(e) => runSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') runSearch('')
            }}
            placeholder="Search nodes…"
            className="w-36 pl-8 pr-7 lg:w-44"
          />
          {search ? (
            <button
              type="button"
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              onClick={() => runSearch('')}
            >
              <X size={13} />
            </button>
          ) : null}
        </div>

        <IconButton label="Undo (mobile)" className="md:hidden" onClick={editor.undo}>
          <Undo2 size={16} />
        </IconButton>
        <IconButton label="Fit View (mobile)" className="md:hidden" onClick={editor.fitView}>
          <Maximize size={16} />
        </IconButton>

        <IconButton label="Save Project" onClick={save}>
          <Save size={16} />
        </IconButton>

        <DropdownMenu
          trigger={
            <IconButton label="Export">
              <Download size={16} />
            </IconButton>
          }
        >
          {(close) => (
            <>
              <MenuLabel>Export</MenuLabel>
              <MenuItem icon={FileJson} onClick={() => { void exportAs('json'); close() }}>
                Export JSON
              </MenuItem>
              <MenuItem icon={ImageIcon} onClick={() => { void exportAs('png'); close() }}>
                Export PNG
              </MenuItem>
              <MenuItem icon={ImageIcon} onClick={() => { void exportAs('svg'); close() }}>
                Export SVG
              </MenuItem>
            </>
          )}
        </DropdownMenu>

        <IconButton label="Load Project" onClick={loadProjectFile}>
          <FileJson size={16} />
        </IconButton>

        <IconButton label="Import Project" onClick={() => fileInputRef.current?.click()}>
          <Upload size={16} />
        </IconButton>

        <DropdownMenu
          trigger={
            <IconButton label="Settings">
              <Settings size={16} />
            </IconButton>
          }
        >
          {(close) => (
            <>
              <MenuItem icon={FilePlus2} onClick={() => { setConfirm('new'); close() }}>
                New Tree
              </MenuItem>
              <MenuItem icon={Trash2} danger onClick={() => { setConfirm('clear'); close() }}>
                Clear Canvas
              </MenuItem>
              <MenuItem icon={Layout} onClick={() => { setConfirm('demo'); close() }}>
                Load Demo Tree
              </MenuItem>
              <MenuSeparator />
              <MenuLabel>Auto Layout Direction</MenuLabel>
              {(Object.keys(LAYOUT_LABELS) as LayoutDirection[]).map((dir) => (
                <MenuItem
                  key={dir}
                  onClick={() => {
                    editor.applyAutoLayout(dir)
                    close()
                  }}
                >
                  {LAYOUT_LABELS[dir]}
                  {editor.settings.layoutDirection === dir ? ' ✓' : ''}
                </MenuItem>
              ))}
              <MenuSeparator />
              <MenuItem
                onClick={() => {
                  editor.setSettings((s) => ({ ...s, showGrid: !s.showGrid }))
                  close()
                }}
              >
                {editor.settings.showGrid ? 'Hide Grid' : 'Show Grid'}
              </MenuItem>
            </>
          )}
        </DropdownMenu>

        <DropdownMenu
          trigger={
            <IconButton label="Theme">
              {editor.theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            </IconButton>
          }
        >
          {(close) => (
            <>
              <MenuLabel>Theme</MenuLabel>
              <MenuItem icon={Sun} onClick={() => { editor.setTheme('light'); close() }}>
                Light
              </MenuItem>
              <MenuItem icon={Moon} onClick={() => { editor.setTheme('dark'); close() }}>
                Dark
              </MenuItem>
              <MenuItem icon={Monitor} onClick={() => { editor.setTheme('system'); close() }}>
                System
              </MenuItem>
              <MenuSeparator />
              <MenuItem icon={Moon} onClick={() => { cycleTheme(); close() }}>
                Quick Toggle
              </MenuItem>
            </>
          )}
        </DropdownMenu>

        <IconButton
          label="Open properties panel"
          className="lg:hidden"
          onClick={onOpenPanel}
        >
          <PanelRight size={17} />
        </IconButton>
      </div>

      {/* hidden import input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/x-nodetree,application/json,.nodetree,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleImportFile(file)
          e.target.value = ''
        }}
      />

      {/* rename dialog */}
      <Dialog
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        title="Rename project"
        footer={
          <>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                editor.rename(renameValue.trim() || 'Untitled Tree')
                setRenameOpen(false)
              }}
            >
              Rename
            </Button>
          </>
        }
      >
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          placeholder="Project name"
          autoFocus
        />
      </Dialog>

      {/* destructive confirmations */}
      <ConfirmDialog
        open={confirm === 'new'}
        title="Start a new tree?"
        description="The current canvas will be replaced by an empty project. You can undo this with Ctrl+Z."
        confirmLabel="New Tree"
        onConfirm={() => {
          editor.replaceProject({ name: 'Untitled Tree', nodes: [], edges: [] })
          editor.toast('New tree created')
          setConfirm(null)
        }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'clear'}
        title="Clear the canvas?"
        description="All nodes and connections will be removed. You can undo this with Ctrl+Z."
        confirmLabel="Clear Canvas"
        onConfirm={() => {
          editor.clearCanvas()
          setConfirm(null)
        }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'demo'}
        title="Load the demo tree?"
        description="The University Organization example will replace the current canvas. You can undo this with Ctrl+Z."
        confirmLabel="Load Demo"
        onConfirm={() => {
          const demo = createDemoTree()
          editor.replaceProject({
            name: 'University Organization',
            nodes: demo.nodes,
            edges: demo.edges,
          })
          setConfirm(null)
        }}
        onCancel={() => setConfirm(null)}
      />
    </header>
  )
}

export default Toolbar
