import { useEffect, useRef } from 'react'
import {
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Clipboard,
  Layout,
  Maximize,
  Palette,
  Pencil,
  Plus,
  Shapes,
  Squirrel,
  Trash2,
  Users,
} from 'lucide-react'
import { MenuSeparator } from '@/components/ui/DropdownMenu'
import { cn } from '@/lib/utils'
import type { NodeShape } from '@/types'

export const COLOR_SWATCHES = [
  '#ffffff',
  '#ecfdf5',
  '#d1fae5',
  '#a7f3d0',
  '#e0f2fe',
  '#dbeafe',
  '#fef3c7',
  '#fee2e2',
  '#f3e8ff',
  '#1e293b',
  '#0f172a',
  '#10b981',
]

const SHAPE_OPTIONS: { value: NodeShape; label: string }[] = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'pill', label: 'Pill' },
  { value: 'circle', label: 'Circle' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'hexagon', label: 'Hexagon' },
  { value: 'card', label: 'Card' },
]

export interface ContextMenuState {
  x: number
  y: number
  kind: 'node' | 'pane'
  nodeId?: string
}

export interface ContextMenuActions {
  onEdit: (nodeId: string) => void
  onDuplicate: () => void
  onAddChild: (nodeId: string) => void
  onAddSibling: (nodeId: string) => void
  onAddParent: (nodeId: string) => void
  onCopy: () => void
  onPaste: (at: { x: number; y: number }) => void
  onDelete: (nodeId: string) => void
  onChangeColor: (nodeId: string, color: string) => void
  onChangeShape: (nodeId: string, shape: NodeShape) => void
  onAddNode: (at: { x: number; y: number }) => void
  onSelectAll: () => void
  onFitView: () => void
  onAutoLayout: () => void
}

/** Floating right-click menu for nodes and the empty canvas. */
function ContextMenu({
  state,
  actions,
  onClose,
  flowPosition,
}: {
  state: ContextMenuState
  actions: ContextMenuActions
  onClose: () => void
  flowPosition: { x: number; y: number }
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  if (state.kind === 'node' && state.nodeId) {
    const nodeId = state.nodeId
    return (
      <div
        ref={ref}
        style={{ left: state.x, top: state.y }}
        className={cn(
          'fixed z-[90] w-52 rounded-xl border border-[var(--border)] bg-[var(--popover)] p-1',
          'shadow-[var(--shadow-lg-soft)] animate-pop',
        )}
      >
        <MenuRow icon={Pencil} label="Edit" onClick={() => actions.onEdit(nodeId)} />
        <MenuRow icon={Copy} label="Duplicate" onClick={() => actions.onDuplicate()} />
        <MenuSeparator />
        <MenuRow icon={Plus} label="Add Child" onClick={() => actions.onAddChild(nodeId)} />
        <MenuRow icon={ChevronsRight} label="Add Sibling" onClick={() => actions.onAddSibling(nodeId)} />
        <MenuRow icon={ChevronsLeft} label="Add Parent" onClick={() => actions.onAddParent(nodeId)} />
        <MenuSeparator />
        <MenuRow icon={Clipboard} label="Copy" onClick={() => actions.onCopy()} />
        <MenuRow icon={Trash2} label="Delete" danger onClick={() => actions.onDelete(nodeId)} />
        <MenuSeparator />
        <div className="flex items-center gap-1.5 px-2.5 py-1.5">
          <Palette size={15} className="shrink-0 opacity-70 text-[var(--popover-foreground)]" />
          <div className="flex flex-wrap gap-1">
            {COLOR_SWATCHES.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Set color ${color}`}
                className="size-4 rounded-full border border-[var(--border)] transition hover:scale-110"
                style={{ background: color }}
                onClick={() => actions.onChangeColor(nodeId, color)}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5">
          <Shapes size={15} className="shrink-0 opacity-70 text-[var(--popover-foreground)]" />
          <div className="flex flex-wrap gap-1">
            {SHAPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                title={option.label}
                className="rounded-md border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--popover-foreground)] transition hover:bg-[var(--secondary)]"
                onClick={() => actions.onChangeShape(nodeId, option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      style={{ left: state.x, top: state.y }}
      className={cn(
        'fixed z-[90] w-52 rounded-xl border border-[var(--border)] bg-[var(--popover)] p-1',
        'shadow-[var(--shadow-lg-soft)] animate-pop',
      )}
    >
      <MenuRow icon={Plus} label="Add Node" onClick={() => actions.onAddNode(flowPosition)} />
      <MenuRow icon={Clipboard} label="Paste" onClick={() => actions.onPaste(flowPosition)} />
      <MenuRow icon={Squirrel} label="Select All" onClick={() => actions.onSelectAll()} />
      <MenuSeparator />
      <MenuRow icon={Maximize} label="Fit View" onClick={() => actions.onFitView()} />
      <MenuRow icon={Layout} label="Auto Layout" onClick={() => actions.onAutoLayout()} />
    </div>
  )
}

function MenuRow({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Users
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors',
        danger
          ? 'text-[var(--destructive)] hover:bg-[var(--destructive)]/10'
          : 'text-[var(--popover-foreground)] hover:bg-[var(--secondary)]',
      )}
    >
      <Icon size={15} className="shrink-0 opacity-70" />
      {label}
    </button>
  )
}

export { ContextMenu }

