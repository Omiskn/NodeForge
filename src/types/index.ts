import type { Edge, Node } from '@xyflow/react'

/** Available node shapes */
export type NodeShape =
  | 'rectangle'
  | 'rounded'
  | 'pill'
  | 'circle'
  | 'diamond'
  | 'hexagon'
  | 'card'
  | 'group'

export type ShadowSize = 'none' | 'small' | 'medium' | 'large'
export type TextAlignment = 'left' | 'center' | 'right'

export type LayoutDirection = 'TB' | 'BT' | 'LR' | 'RL'

export type EdgeStyleType = 'smoothstep' | 'bezier' | 'straight' | 'step'

export type LegendPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

/** Visual styling for a single node */
export interface NodeStyle {
  background: string
  borderColor: string
  textColor: string
  borderWidth: number
  borderRadius: number
  width: number
  height: number
  fontSize: number
  fontWeight: number
  alignment: TextAlignment
  shadow: ShadowSize
  opacity: number
}

/** All editable content + style of a tree node */
export interface NodeData extends Record<string, unknown> {
  title: string
  subtitle: string
  description: string
  icon: string
  imageUrl: string
  /** Optional semantic category (e.g. "Academic Affairs") used by the legend and grouping */
  category: string
  shape: NodeShape
  style: NodeStyle
  /** Whether this node's branch is collapsed (children hidden) */
  collapsed?: boolean
  /** Whether this node acts as a visual group container */
  isGroup?: boolean
  /** Timestamp used for search highlighting */
  highlightedAt?: number
}

/** Visual styling for an edge */
export interface EdgeStyleData extends Record<string, unknown> {
  color: string
  width: number
  type: EdgeStyleType
  animated: boolean
  arrow: boolean
}

export type TreeNode = Node<NodeData, 'treeNode'>
export type TreeEdge = Edge<EdgeStyleData>

export type LayoutEdge = Edge<EdgeStyleData>

export interface CanvasSettings {
  showGrid: boolean
  layoutDirection: LayoutDirection
  /** Show the auto-detected color/category legend over the canvas */
  showLegend: boolean
  legendPosition: LegendPosition
  /** Active color/category filter; null shows every node */
  focusGroup: string | null
}

export interface ThemeMode {
  mode: 'light' | 'dark' | 'system'
}

/** Manual label override for an auto-detected legend entry */
export interface LegendConfig {
  /** Keyed by legend entry id: `${category}|||${color}` */
  labels: Record<string, string>
}

/** A ready-made template (nodes + edges laid out as a tree) */
export interface TreeTemplate {
  id: string
  name: string
  description: string
  build: () => { nodes: TreeNode[]; edges: TreeEdge[] }
}

/** Full serializable project stored in localStorage / .nodetree files */
export interface Project {
  name: string
  version: 1
  nodes: TreeNode[]
  edges: TreeEdge[]
  settings: CanvasSettings
  /** Optional manual legend labels; absent on older files */
  legend?: LegendConfig
}
