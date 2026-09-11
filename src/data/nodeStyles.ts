import type { NodeStyle, NodeShape, NodeData } from '@/types'

/**
 * Default node style — clean card with soft border and subtle shadow.
 * Every new node starts from this and users customize from here.
 */
export function defaultNodeStyle(): NodeStyle {
  return {
    background: 'var(--node-bg)',
    borderColor: 'var(--node-border)',
    textColor: 'var(--node-text)',
    borderWidth: 1,
    borderRadius: 12,
    width: 190,
    height: 64,
    fontSize: 14,
    fontWeight: 600,
    alignment: 'center',
    shadow: 'small',
    opacity: 1,
  }
}

/** Extra style tweaks applied when the user picks a shape */
export const shapePresets: Record<NodeShape, Partial<NodeStyle>> = {
  rectangle: { borderRadius: 0 },
  rounded: { borderRadius: 12 },
  pill: { borderRadius: 999 },
  circle: { borderRadius: 999, width: 96, height: 96 },
  diamond: { borderRadius: 8 },
  hexagon: { borderRadius: 8 },
  card: { borderRadius: 14, width: 210, height: 92 },
  group: {
    borderRadius: 16,
    background: 'var(--accent)',
    borderColor: 'var(--primary)',
    borderWidth: 1,
    width: 520,
    height: 300,
    shadow: 'none',
    opacity: 0.55,
    fontWeight: 700,
  },
}

/** Input shape for creating/updating node data (style is partial here). */
export type NodeDataInput = {
  title?: string
  subtitle?: string
  description?: string
  icon?: string
  imageUrl?: string
  category?: string
  shape?: NodeShape
  collapsed?: boolean
  isGroup?: boolean
  style?: Partial<NodeStyle>
}

/** Create fully-populated node data from a partial override. */
export function makeNodeData(partial: NodeDataInput = {}): NodeData {
  return {
    title: partial.title ?? 'New Node',
    subtitle: partial.subtitle ?? '',
    description: partial.description ?? '',
    icon: partial.icon ?? '',
    imageUrl: partial.imageUrl ?? '',
    category: partial.category ?? '',
    shape: partial.shape ?? 'rounded',
    style: { ...defaultNodeStyle(), ...partial.style },
    collapsed: partial.collapsed ?? false,
    isGroup: partial.isGroup ?? false,
  }
}

/** Sidebar node templates with a small preview of each shape */
export interface NodeTypeTemplate {
  id: string
  label: string
  shape: NodeShape
  preview: Partial<NodeStyle>
}

export const nodeTypeTemplates: NodeTypeTemplate[] = [
  { id: 'rectangle', label: 'Rectangle', shape: 'rectangle', preview: { borderRadius: 0 } },
  { id: 'rounded', label: 'Rounded', shape: 'rounded', preview: { borderRadius: 10 } },
  { id: 'pill', label: 'Pill', shape: 'pill', preview: { borderRadius: 999, width: 120 } },
  { id: 'circle', label: 'Circle', shape: 'circle', preview: { borderRadius: 999, width: 64, height: 64 } },
  { id: 'diamond', label: 'Diamond', shape: 'diamond', preview: {} },
  { id: 'hexagon', label: 'Hexagon', shape: 'hexagon', preview: {} },
  { id: 'card', label: 'Custom Card', shape: 'card', preview: { borderRadius: 12, width: 150, height: 70 } },
  { id: 'group', label: 'Group', shape: 'group', preview: {} },
]

