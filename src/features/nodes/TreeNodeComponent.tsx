import { Handle, Position, type NodeProps } from '@xyflow/react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { getIcon } from '@/data/icons'
import type { NodeStyle, NodeData, TreeNode } from '@/types'
import { cn } from '@/lib/utils'


const shadowMap: Record<NodeStyle['shadow'], string> = {
  none: 'none',
  small: 'var(--shadow-sm-soft)',
  medium: 'var(--shadow-md-soft)',
  large: 'var(--shadow-lg-soft)',
}

/** Fixed inset polygon for the background layer of clip-path shapes */
const DIAMOND_BORDER = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
const DIAMOND_BG = 'polygon(50% 4%, 96% 50%, 50% 96%, 4% 50%)'
const HEXAGON_BORDER = 'polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)'
const HEXAGON_BG = 'polygon(21% 2%, 79% 2%, 97% 50%, 79% 98%, 21% 98%, 3% 50%)'

function borderClipFor(shape: NodeData['shape']) {
  if (shape === 'diamond') return DIAMOND_BORDER
  if (shape === 'hexagon') return HEXAGON_BORDER
  return undefined
}

function bgClipFor(shape: NodeData['shape']) {
  if (shape === 'diamond') return DIAMOND_BG
  if (shape === 'hexagon') return HEXAGON_BG
  return undefined
}

function borderRadiusFor(style: NodeStyle, shape: NodeData['shape']) {
  switch (shape) {
    case 'rectangle':
      return 0
    case 'pill':
    case 'circle':
      return 9999
    case 'diamond':
    case 'hexagon':
      return 0
    case 'group':
      return 16
    default:
      return style.borderRadius
  }
}

function alignFor(alignment: NodeStyle['alignment']) {
  return alignment === 'left' ? 'flex-start' : alignment === 'right' ? 'flex-end' : 'center'
}

/** Icon + title + subtitle + description block shared by simple shapes */
function SimpleContent({ data }: { data: NodeData }) {
  const { style, shape } = data
  const Icon = data.icon ? getIcon(data.icon) : undefined
  const bgClip = bgClipFor(shape)

  return (
    <div
      className="flex h-full w-full flex-col justify-center gap-0.5 px-2"
      style={{
        borderRadius: borderRadiusFor(style, shape),
        background: style.background,
        clipPath: bgClip,
        color: style.textColor,
        textAlign: style.alignment,
        alignItems: alignFor(style.alignment),
      }}
    >
      {data.imageUrl && shape !== 'diamond' ? (
        <img
          src={data.imageUrl}
          alt=""
          className="size-8 shrink-0 rounded-full object-cover"
          style={{ alignSelf: alignFor(style.alignment) }}
        />
      ) : Icon ? (
        <Icon
          size={style.fontSize + 4}
          className="shrink-0"
          style={{ color: shape === 'circle' || shape === 'pill' ? style.textColor : 'var(--primary)' }}
        />
      ) : null}
      <div
        className="w-full truncate"
        style={{ fontSize: style.fontSize, fontWeight: style.fontWeight }}
      >
        {data.title}
      </div>
      {data.subtitle ? (
        <div className="w-full truncate text-[11px] opacity-65">{data.subtitle}</div>
      ) : null}
    </div>
  )
}

/** Card-style content: icon/avatar, title, subtitle, description */
function CardContent({ data }: { data: NodeData }) {
  const { style } = data
  const Icon = data.icon ? getIcon(data.icon) : undefined

  return (
    <div
      className="flex h-full w-full flex-col justify-center gap-1 px-3.5 py-2.5"
      style={{
        borderRadius: style.borderRadius,
        background: style.background,
        color: style.textColor,
        textAlign: style.alignment,
        alignItems: alignFor(style.alignment),
      }}
    >
      {data.imageUrl ? (
        <img
          src={data.imageUrl}
          alt=""
          className="mb-1 size-9 rounded-full object-cover"
          style={{ alignSelf: alignFor(style.alignment) }}
        />
      ) : Icon ? (
        <Icon size={20} className="mb-0.5 shrink-0" style={{ color: 'var(--primary)' }} />
      ) : null}
      <div
        className="w-full truncate"
        style={{ fontSize: style.fontSize, fontWeight: style.fontWeight }}
      >
        {data.title}
      </div>
      {data.subtitle ? (
        <div className="w-full truncate text-xs opacity-70">{data.subtitle}</div>
      ) : null}
      {data.description ? (
        <div className="w-full truncate text-xs opacity-55">{data.description}</div>
      ) : null}
    </div>
  )
}

/** Group container: titled, dashed, semi-transparent backdrop for other nodes */
function GroupContent({ data }: { data: NodeData }) {
  const { style } = data
  const Icon = data.icon ? getIcon(data.icon) : undefined

  return (
    <div
      className="flex h-full w-full flex-col"
      style={{
        borderRadius: 16,
        border: `${style.borderWidth}px dashed ${style.borderColor}`,
        background: style.background,
        color: style.textColor,
        boxShadow: shadowMap[style.shadow],
      }}
    >
      <div
        className="flex items-center gap-1.5 px-3 py-1.5"
        style={{
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          justifyContent: alignFor(style.alignment),
        }}
      >
        {Icon ? <Icon size={style.fontSize + 3} /> : null}
        <span className="truncate">{data.title}</span>
      </div>
      {data.subtitle ? (
        <div className="px-3 text-xs opacity-70">{data.subtitle}</div>
      ) : null}
    </div>
  )
}

const HANDLES: { id: string; position: Position }[] = [
  { id: 't', position: Position.Top },
  { id: 'r', position: Position.Right },
  { id: 'b', position: Position.Bottom },
  { id: 'l', position: Position.Left },
]

/** The interactive tree node rendered by React Flow. */
function TreeNodeComponent({ id, data, selected }: NodeProps<TreeNode>) {
  const { style, shape } = data
  const borderClip = borderClipFor(shape)

  return (
    <div
      className={cn('relative h-full w-full', data.highlightedAt && 'node-highlight')}
      style={{ opacity: style.opacity }}
    >
      {/*
        Connection handles on every side. New parent → child edges always use
        the BOTTOM source / TOP target so connectors flow downward; the other
        handles stay connectable for custom manual layouts. Dots appear on
        hover or selection so drag targets are visually clear.
      */}
      {HANDLES.map((h) => (
        <Handle
          key={`s-${h.id}`}
          id={`s-${h.id}`}
          type="source"
          position={h.position}
          className="tree-handle"
        />
      ))}
      {HANDLES.map((h) => (
        <Handle
          key={`t-${h.id}`}
          id={`t-${h.id}`}
          type="target"
          position={h.position}
          className="tree-handle"
        />
      ))}

      {borderClip ? (
        /* Diamond / hexagon: border layer + inset background layer */
        <>
          <div
            className="absolute inset-0"
            style={{
              clipPath: borderClip,
              background: style.borderColor,
              boxShadow: shadowMap[style.shadow],
            }}
          />
          <div
            className={cn(
              'absolute',
              selected && 'ring-2 ring-[var(--primary)] ring-offset-1 ring-offset-[var(--background)]',
            )}
            style={{ inset: Math.max(style.borderWidth, 1) }}
          >
            <SimpleContent data={data} />
          </div>
        </>
      ) : (
        /* Regular shapes: single bordered body */
        <div
          className={cn(
            'relative h-full w-full',
            selected && 'ring-2 ring-[var(--primary)] ring-offset-1 ring-offset-[var(--background)]',
          )}
          style={{
            borderRadius: borderRadiusFor(style, shape),
            border:
              style.borderWidth > 0 && shape !== 'group'
                ? `${style.borderWidth}px solid ${style.borderColor}`
                : 'none',
            boxShadow: shadowMap[style.shadow],
            overflow: 'hidden',
          }}
        >
          {shape === 'group' ? (
            <GroupContent data={data} />
          ) : shape === 'card' ? (
            <CardContent data={data} />
          ) : (
            <SimpleContent data={data} />
          )}
        </div>
      )}

      {/* Collapse / expand branch toggle */}
      <button
        type="button"
        aria-label={data.collapsed ? 'Expand branch' : 'Collapse branch'}
        className={cn(
          'absolute -bottom-3 left-1/2 z-20 flex size-5 -translate-x-1/2 items-center justify-center rounded-full border',
          'bg-[var(--card)] text-[var(--muted-foreground)] transition-colors hover:text-[var(--primary)]',
          'shadow-[var(--shadow-sm-soft)]',
        )}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          window.dispatchEvent(
            new CustomEvent('nodetree:toggle-collapse', { detail: id }),
          )
        }}
      >
        {data.collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
      </button>
    </div>
  )
}

export default TreeNodeComponent


