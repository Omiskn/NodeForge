import { useState } from 'react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  Eraser,
  Trash2,
} from 'lucide-react'
import {
  Button,
  Field,
  Input,
  SectionTitle,
  Select,
  Textarea,
} from '@/components/ui/primitives'
import { ColorField } from '@/components/ui/ColorField'
import { ICON_CATALOG } from '@/data/icons'
import { edgeTypeOptions } from '@/data/edgeStyles'
import { shapePresets } from '@/data/nodeStyles'
import type { NodeShape, ShadowSize } from '@/types'
import type { TreeEditor } from '@/hooks/useTreeEditor'
import { cn } from '@/lib/utils'

/* Numeric field with live update */
function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <Field label={label}>
      <Input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const next = Number(e.target.value)
          if (Number.isFinite(next)) onChange(next)
        }}
        className="h-7 text-xs"
      />
    </Field>
  )
}

function PropertiesPanel({ editor, onClose }: { editor: TreeEditor; onClose?: () => void }) {
  const selectedNodes = editor.nodes.filter((n) => n.selected)
  const node = selectedNodes.length === 1 ? selectedNodes[0] : null
  const multi = selectedNodes.length > 1
  const selectedEdges = editor.edges.filter((e) => e.selected)
  const edge = selectedEdges.length === 1 ? selectedEdges[0] : null
  const [iconPickerOpen, setIconPickerOpen] = useState(false)

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-l border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Properties</h2>
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

      <div className="thin-scroll flex-1 space-y-5 overflow-y-auto p-3.5">
        {multi ? <MultiSelectSection editor={editor} count={selectedNodes.length} /> : null}
        {node ? (
          <NodeSection
            editor={editor}
            nodeId={node.id}
            iconPickerOpen={iconPickerOpen}
            setIconPickerOpen={setIconPickerOpen}
          />
        ) : null}
        {!node && !multi && edge ? <EdgeSection editor={editor} edgeId={edge.id} /> : null}
        {!node && !multi && !edge ? <EmptyState /> : null}
      </div>
    </aside>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--border)] p-6 text-center">
      <p className="text-sm font-medium text-[var(--foreground)]">
        Select a node to edit its properties
      </p>
      <p className="text-xs text-[var(--muted-foreground)]">
        Or select an edge to customize the connector style.
      </p>
    </div>
  )
}

function MultiSelectSection({ editor, count }: { editor: TreeEditor; count: number }) {
  return (
    <div className="space-y-4">
      <SectionTitle title={`${count} Nodes Selected`} />
      <div>
        <SectionTitle title="Bulk Style" />
        <div className="space-y-2">
          <ColorField
            label="Background"
            value="#ffffff"
            onChange={(color) => editor.bulkUpdate({ background: color })}
          />
          <ColorField
            label="Text"
            value="#1e293b"
            onChange={(color) => editor.bulkUpdate({ textColor: color })}
          />
          <Field label="Shape">
            <Select
              className="h-7 text-xs"
              value=""
              onChange={(e) => {
                const shape = e.target.value as NodeShape
                editor.bulkUpdate(shapePresets[shape], { shape })
              }}
            >
              <option value="" disabled>
                Change shape…
              </option>
              {(Object.keys(shapePresets) as NodeShape[]).map((shape) => (
                <option key={shape} value={shape}>
                  {shape}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Border">
            <Input
              type="color"
              defaultValue="#dbe3ec"
              onChange={(e) => editor.bulkUpdate({ borderColor: e.target.value })}
              className="h-7 w-10 cursor-pointer p-0.5"
            />
            <Input
              type="number"
              min={0}
              max={8}
              defaultValue={1}
              onChange={(e) =>
                editor.bulkUpdate({ borderWidth: Number(e.target.value) })
              }
              className="h-7 w-16 text-xs"
            />
          </Field>
        </div>
      </div>
      <div>
        <SectionTitle title="Align & Distribute" />
        <div className="flex flex-wrap gap-1.5">
          <Button variant="outline" size="sm" onClick={() => editor.alignSelected('left')}>
            <AlignLeft size={13} /> Left
          </Button>
          <Button variant="outline" size="sm" onClick={() => editor.alignSelected('center-h')}>
            <AlignCenter size={13} /> Center
          </Button>
          <Button variant="outline" size="sm" onClick={() => editor.alignSelected('right')}>
            <AlignRight size={13} /> Right
          </Button>
          <Button variant="outline" size="sm" onClick={() => editor.alignSelected('top')}>
            Top
          </Button>
          <Button variant="outline" size="sm" onClick={() => editor.alignSelected('bottom')}>
            Bottom
          </Button>
          <Button
            variant="outline"
            size="sm"
            title="Distribute horizontally"
            onClick={() => editor.distributeSelected('h')}
          >
            <AlignHorizontalDistributeCenter size={13} /> H
          </Button>
          <Button
            variant="outline"
            size="sm"
            title="Distribute vertically"
            onClick={() => editor.distributeSelected('v')}
          >
            <AlignVerticalDistributeCenter size={13} /> V
          </Button>
        </div>
      </div>
      <Button variant="destructive" className="w-full" onClick={() => editor.deleteSelected()}>
        <Trash2 size={14} />
        Delete Selected
      </Button>
    </div>
  )
}

/* ---------------- single node editor ---------------- */

const SHAPE_LABELS: { value: NodeShape; label: string }[] = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'pill', label: 'Pill' },
  { value: 'circle', label: 'Circle' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'hexagon', label: 'Hexagon' },
  { value: 'card', label: 'Card' },
  { value: 'group', label: 'Group' },
]

const ICON_NAMES = ['', ...Object.keys(ICON_CATALOG)]

function NodeSection({
  editor,
  nodeId,
  iconPickerOpen,
  setIconPickerOpen,
}: {
  editor: TreeEditor
  nodeId: string
  iconPickerOpen: boolean
  setIconPickerOpen: (open: boolean) => void
}) {
  const node = editor.nodes.find((n) => n.id === nodeId)
  if (!node) return <EmptyState />
  const data = node.data
  const style = data.style

  const setData = (partial: Partial<typeof data>, coalesceKey?: string) =>
    editor.updateNodeData(nodeId, partial, coalesceKey)
  const setStyle = (partial: Partial<typeof style>, coalesceKey?: string) =>
    editor.updateNodeStyle(nodeId, partial, coalesceKey)

  return (
    <div className="space-y-4">
      {/* CONTENT */}
      <div>
        <SectionTitle title="Content" />
        <div className="space-y-2">
          <Field label="Title">
            <Input
              id="prop-title-input"
              value={data.title}
              onChange={(e) => setData({ title: e.target.value }, `title:${nodeId}`)}
              className="h-7 text-xs"
            />
          </Field>
          <Field label="Subtitle">
            <Input
              value={data.subtitle}
              onChange={(e) => setData({ subtitle: e.target.value }, `sub:${nodeId}`)}
              className="h-7 text-xs"
            />
          </Field>
          <Field label="Description" className="items-start">
            <Textarea
              value={data.description}
              onChange={(e) => setData({ description: e.target.value }, `desc:${nodeId}`)}
              className="min-h-14 text-xs"
            />
          </Field>
          <Field label="Icon">
            <button
              type="button"
              className="h-7 flex-1 rounded-lg border border-[var(--input)] px-2 text-left text-xs transition-colors hover:border-[var(--primary)]"
              onClick={() => setIconPickerOpen(!iconPickerOpen)}
            >
              {data.icon || 'Choose icon…'}
            </button>
          </Field>
          {iconPickerOpen ? (
            <div className="thin-scroll grid max-h-40 grid-cols-6 gap-1 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--background)] p-1.5">
              {ICON_NAMES.map((name) => {
                const Icon = ICON_CATALOG[name]
                return (
                  <button
                    key={name || 'none'}
                    type="button"
                    title={name || 'No icon'}
                    className={cn(
                      'flex size-7 items-center justify-center rounded-md text-[var(--foreground)] transition-colors hover:bg-[var(--secondary)]',
                      data.icon === name &&
                        'bg-[var(--accent)] text-[var(--accent-foreground)]',
                    )}
                    onClick={() => {
                      setData({ icon: name })
                      setIconPickerOpen(false)
                    }}
                  >
                    {Icon ? <Icon size={14} /> : <Eraser size={14} />}
                  </button>
                )
              })}
            </div>
          ) : null}
          <Field label="Image URL">
            <Input
              value={data.imageUrl}
              onChange={(e) => setData({ imageUrl: e.target.value }, `img:${nodeId}`)}
              placeholder="https://…"
              className="h-7 text-xs"
            />
          </Field>
        </div>
      </div>

      {/* SHAPE */}
      <div>
        <SectionTitle title="Shape" />
        <Field label="Type">
          <Select
            className="h-7 text-xs"
            value={data.shape}
            onChange={(e) => {
              const shape = e.target.value as NodeShape
              editor.updateNodeData(nodeId, { shape })
              editor.updateNodeStyle(nodeId, shapePresets[shape])
            }}
          >
            {SHAPE_LABELS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {/* COLORS */}
      <div>
        <SectionTitle title="Colors" />
        <div className="space-y-2">
          <ColorField label="Background" value={style.background} onChange={(color) => setStyle({ background: color })} />
          <ColorField label="Border" value={style.borderColor} onChange={(color) => setStyle({ borderColor: color })} />
          <ColorField label="Text" value={style.textColor} onChange={(color) => setStyle({ textColor: color })} />
        </div>
      </div>

      {/* TYPOGRAPHY */}
      <div>
        <SectionTitle title="Typography" />
        <div className="space-y-2">
          <NumberField label="Font Size" value={style.fontSize} min={8} max={40} onChange={(fontSize) => setStyle({ fontSize })} />
          <Field label="Weight">
            <Select
              className="h-7 text-xs"
              value={style.fontWeight}
              onChange={(e) => setStyle({ fontWeight: Number(e.target.value) })}
            >
              <option value={400}>Normal</option>
              <option value={500}>Medium</option>
              <option value={600}>Semibold</option>
              <option value={700}>Bold</option>
            </Select>
          </Field>
          <Field label="Align">
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map((alignment) => {
                const Icon =
                  alignment === 'left' ? AlignLeft : alignment === 'center' ? AlignCenter : AlignRight
                return (
                  <button
                    key={alignment}
                    type="button"
                    title={alignment}
                    className={cn(
                      'flex size-7 items-center justify-center rounded-md border text-[var(--foreground)] transition-colors hover:bg-[var(--secondary)]',
                      style.alignment === alignment
                        ? 'border-[var(--primary)] bg-[var(--accent)] text-[var(--accent-foreground)]'
                        : 'border-[var(--input)]',
                    )}
                    onClick={() => setStyle({ alignment })}
                  >
                    <Icon size={13} />
                  </button>
                )
              })}
            </div>
          </Field>
        </div>
      </div>

      {/* SIZE */}
      <div>
        <SectionTitle title="Size" />
        <div className="space-y-2">
          <NumberField label="Width" value={style.width} min={40} max={1200} onChange={(width) => setStyle({ width })} />
          <NumberField label="Height" value={style.height} min={30} max={1200} onChange={(height) => setStyle({ height })} />
        </div>
      </div>

      {/* BORDER */}
      <div>
        <SectionTitle title="Border" />
        <div className="space-y-2">
          <NumberField label="Width" value={style.borderWidth} min={0} max={8} onChange={(borderWidth) => setStyle({ borderWidth })} />
          <NumberField label="Radius" value={style.borderRadius} min={0} max={999} onChange={(borderRadius) => setStyle({ borderRadius })} />
        </div>
      </div>

      {/* SHADOW + OPACITY */}
      <div>
        <SectionTitle title="Shadow & Opacity" />
        <div className="space-y-2">
          <Field label="Shadow">
            <Select
              className="h-7 text-xs"
              value={style.shadow}
              onChange={(e) => setStyle({ shadow: e.target.value as ShadowSize })}
            >
              <option value="none">None</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </Select>
          </Field>
          <NumberField
            label="Opacity"
            value={style.opacity}
            min={0.05}
            max={1}
            step={0.05}
            onChange={(opacity) => setStyle({ opacity })}
          />
        </div>
      </div>

      {/* POSITION */}
      <div>
        <SectionTitle title="Position" />
        <div className="space-y-2">
          <NumberField
            label="X"
            value={node.position.x}
            min={-99999}
            max={99999}
            onChange={(x) => editor.updateNodePosition(nodeId, x, node.position.y)}
          />
          <NumberField
            label="Y"
            value={node.position.y}
            min={-99999}
            max={99999}
            onChange={(y) => editor.updateNodePosition(nodeId, node.position.x, y)}
          />
        </div>
      </div>

      <Button variant="destructive" className="w-full" onClick={() => editor.deleteSelected()}>
        <Trash2 size={14} />
        Delete Node
      </Button>
    </div>
  )
}

/* ---------------- edge editor ---------------- */

function EdgeSection({ editor, edgeId }: { editor: TreeEditor; edgeId: string }) {
  const edge = editor.edges.find((e) => e.id === edgeId)
  if (!edge || !edge.data) return <EmptyState />
  const data = edge.data

  return (
    <div className="space-y-4">
      <SectionTitle title="Connection" />
      <div className="space-y-2">
        <Field label="Type">
          <Select
            className="h-7 text-xs"
            value={data.type}
            onChange={(e) =>
              editor.updateEdge(edgeId, { type: e.target.value as typeof data.type })
            }
          >
            {edgeTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <ColorField label="Color" value={data.color} onChange={(color) => editor.updateEdge(edgeId, { color })} />
        <NumberField
          label="Width"
          value={data.width}
          min={0.5}
          max={10}
          step={0.5}
          onChange={(width) => editor.updateEdge(edgeId, { width })}
        />
        <Field label="Animated">
          <input
            type="checkbox"
            checked={data.animated}
            onChange={(e) => editor.updateEdge(edgeId, { animated: e.target.checked })}
            className="size-4 accent-[var(--primary)]"
          />
        </Field>
        <Field label="Arrow">
          <input
            type="checkbox"
            checked={data.arrow}
            onChange={(e) => editor.updateEdge(edgeId, { arrow: e.target.checked })}
            className="size-4 accent-[var(--primary)]"
          />
        </Field>
      </div>
      <Button variant="destructive" className="w-full" onClick={() => editor.deleteSelected()}>
        <Trash2 size={14} />
        Delete Connection
      </Button>
    </div>
  )
}

export default PropertiesPanel



