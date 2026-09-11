import type { DragEvent } from 'react'
import { useState } from 'react'
import {
  ChevronsDown,
  ChevronsRight,
  ChevronsUp,
  LayoutTemplate,
  Plus,
  Shapes,
} from 'lucide-react'
import { Button } from '@/components/ui/primitives'
import { nodeTypeTemplates, shapePresets } from '@/data/nodeStyles'
import { templates } from '@/data/templates'
import { SHAPE_DRAG_MIME } from '@/features/canvas/TreeCanvas'
import type { NodeStyle, TreeTemplate } from '@/types'
import type { TreeEditor } from '@/hooks/useTreeEditor'
import { cn } from '@/lib/utils'

interface SidebarProps {
  editor: TreeEditor
  onClose?: () => void
}

/** Small visual preview of a node shape, as it appears on the canvas */
function ShapePreview({ style, label }: { style: Partial<NodeStyle>; label: string }) {
  return (
    <div
      className="flex h-11 w-full items-center justify-center border border-[var(--node-border)] bg-[var(--node-bg)] px-1 text-[10px] font-medium text-[var(--node-text)] shadow-[var(--shadow-sm-soft)] transition-transform group-hover:scale-105"
      style={{
        borderRadius: style.borderRadius ?? 10,
        width: style.width ?? 96,
        maxWidth: '100%',
        height: style.height ?? 44,
      }}
    >
      <span className="truncate">{label}</span>
    </div>
  )
}

/** Node templates + hierarchy actions + ready-made tree templates */
function LeftSidebar({ editor, onClose }: SidebarProps) {
  const selectedNodes = editor.nodes.filter((n) => n.selected)
  const selectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null

  const [relateAs, setRelateAs] = useState<'child' | 'sibling' | 'parent' | 'unconnected' | null>(null)

  function onDragStart(event: DragEvent, shape: string) {
    event.dataTransfer.setData(SHAPE_DRAG_MIME, shape)
    event.dataTransfer.effectAllowed = 'copy'
  }

  function addShape(shape: (typeof nodeTypeTemplates)[number]['shape']) {
    const center = editor.viewportCenter()
    editor.addNodeAt(
      { shape, title: 'New Node', style: { ...shapePresets[shape] } },
      center,
    )
  }

  function addRelativeToSelected(shape: (typeof nodeTypeTemplates)[number]['shape']) {
    if (!selectedNode) return
    const partial: Parameters<typeof editor.addRelative>[2] = {
      shape,
      title: 'New Node',
      style: { ...shapePresets[shape] },
    }
    if (relateAs === 'unconnected') {
      const center = editor.viewportCenter()
      editor.addNodeAt(partial, center)
      return
    }
    editor.addRelative(selectedNode.id, relateAs as 'child' | 'sibling' | 'parent', partial)
  }

  function loadTemplate(template: TreeTemplate) {
    const built = template.build()
    editor.replaceProject({
      name: template.name,
      nodes: built.nodes,
      edges: built.edges,
    })
    editor.toast(`Template "${template.name}" loaded`, 'success')
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
          <Shapes size={15} className="text-[var(--primary)]" />
          Nodes
        </h2>
        {onClose ? (
          <button
            type="button"
            aria-label="Close panel"
            onClick={onClose}
            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            ✕
          </button>
        ) : null}
      </div>

      <div className="thin-scroll flex-1 overflow-y-auto p-3">
        <Button className="mb-4 w-full" onClick={() => addShape('rounded')}>
          <Plus size={15} />
          Add Node
        </Button>

        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Hierarchy
        </p>

        {selectedNode ? (
          <>
            <div className="mb-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] p-2">
              <p className="mb-1.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                Add to “{selectedNode.data.title || 'node'}” as…
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { value: 'child' as const, label: 'Child', icon: ChevronsDown },
                  { value: 'sibling' as const, label: 'Sibling', icon: ChevronsRight },
                  { value: 'parent' as const, label: 'Parent', icon: ChevronsUp },
                  { value: 'unconnected' as const, label: 'Unlinked', icon: Plus },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRelateAs(relateAs === value ? null : value)}
                    title={`Add a new ${label.toLowerCase()} of the selected node`}
                    className={cn(
                      'flex flex-col items-center gap-0.5 rounded-lg border p-1.5 text-[10px] transition-colors',
                      relateAs === value
                        ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                        : 'border-[var(--border)] bg-transparent text-[var(--foreground)] hover:border-[var(--primary)]',
                    )}
                  >
                    <Icon size={14} />
                    <span className="leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="mb-4 w-full text-xs"
              onClick={() => addRelativeToSelected('rounded')}
              disabled={relateAs === null}
            >
              <Plus size={14} />
              {relateAs === 'unconnected' ? 'Add Unlinked Node' : relateAs === 'parent' ? 'Add Parent Node' : relateAs === 'sibling' ? 'Add Sibling Node' : 'Add Child Node'}
            </Button>
          </>
        ) : (
          <p className="mb-3 text-[10px] text-[var(--muted-foreground)]">
            Select a node to add a relative, or use the button below for a standalone node.
          </p>
        )}

        <Button
          variant="outline"
          className="mb-4 w-full text-xs"
          onClick={() => {
            const center = editor.viewportCenter()
            editor.addNodeAt(
              { title: 'New Node' },
              { x: center.x, y: center.y },
            )
          }}
        >
          <Plus size={14} />
          Standalone Node
        </Button>

        {/* node shapes */}
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Node Types
        </p>
        <div className="mb-4 grid grid-cols-2 gap-2">
          {nodeTypeTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              draggable
              onDragStart={(e) => onDragStart(e, template.shape)}
              onClick={() => addShape(template.shape)}
              title={`Click to add or drag onto the canvas — ${template.label}`}
              className={cn(
                'group flex cursor-grab flex-col items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--background)] p-2.5',
                'transition-colors hover:border-[var(--primary)] active:cursor-grabbing',
              )}
            >
              <ShapePreview style={template.preview} label={template.label} />
              <span className="text-[10px] text-[var(--muted-foreground)]">
                {template.label}
              </span>
            </button>
          ))}
        </div>

        {/* ready-made tree templates */}
        <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          <LayoutTemplate size={12} />
          Templates
        </p>
        <div className="flex flex-col gap-1.5">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => loadTemplate(template)}
              className="flex items-start gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] p-2.5 text-left transition-colors hover:border-[var(--primary)]"
            >
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)]">
                <LayoutTemplate size={14} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium text-[var(--foreground)]">
                  {template.name}
                </span>
                <span className="block truncate text-[10px] text-[var(--muted-foreground)]">
                  {template.description}
                </span>
              </span>
            </button>
          ))}
        </div>

        <p className="mt-4 rounded-lg bg-[var(--accent)] p-2.5 text-[10px] leading-relaxed text-[var(--accent-foreground)]">
          Tip: drag a node type onto the canvas, then right-click a node to
          build the hierarchy quickly. Everything auto-saves in your browser.
        </p>
      </div>
    </aside>
  )
}

export default LeftSidebar

