import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react'
import { autoLayout } from '@/lib/layout'
import { canonicalHandles, withCanonicalHandles, wouldCreateCycle } from '@/lib/edgeHandles'
import { uid } from '@/lib/utils'
import { defaultCanvasSettings, defaultEdgeStyle } from '@/data/edgeStyles'
import { makeNodeData, type NodeDataInput } from '@/data/nodeStyles'
import { createDemoTree } from '@/data/templates'
import { useHistory } from '@/hooks/useHistory'
import type {
  CanvasSettings,
  EdgeStyleData,
  LayoutDirection,
  NodeData,
  NodeStyle,
  Project,
  TreeEdge,
  TreeNode,
} from '@/types'

export const STORAGE_KEY = 'nodetree:project:v1'
const THEME_KEY = 'nodetree:theme'
const SAVE_DEBOUNCE = 600

export interface Toast {
  id: number
  message: string
  kind: 'info' | 'success' | 'error'
}

interface Doc {
  nodes: TreeNode[]
  edges: TreeEdge[]
}

function makeTreeEdge(source: string, target: string): TreeEdge {
  return withCanonicalHandles({
    id: uid('e'),
    source,
    target,
    type: 'smoothstep',
    data: defaultEdgeStyle(),
  })
}

/** Map an edge style type to the React Flow edge type name */
export function rfEdgeType(type: EdgeStyleData['type']): string {
  switch (type) {
    case 'bezier':
      return 'default'
    case 'straight':
      return 'straight'
    case 'step':
      return 'step'
    default:
      return 'smoothstep'
  }
}

function loadStoredProject(): Project | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Project
    if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges))
      return null
    return parsed
  } catch {
    return null
  }
}

function createInitialProject(): Project {
  const demo = createDemoTree()
  return {
    name: 'University Organization',
    version: 1,
    nodes: demo.nodes,
    edges: demo.edges,
    settings: { ...defaultCanvasSettings() },
  }
}

/** Nodes/edges hidden because an ancestor branch is collapsed */
function computeVisible(nodes: TreeNode[], edges: TreeEdge[]) {
  const childrenOf = new Map<string, string[]>()
  for (const edge of edges) {
    const list = childrenOf.get(edge.source) ?? []
    list.push(edge.target)
    childrenOf.set(edge.source, list)
  }
  const hidden = new Set<string>()
  const visitDescendants = (nodeId: string) => {
    for (const child of childrenOf.get(nodeId) ?? []) {
      if (!hidden.has(child)) {
        hidden.add(child)
        visitDescendants(child)
      }
    }
  }
  for (const node of nodes) {
    if (node.data.collapsed) visitDescendants(node.id)
  }
  return {
    visibleNodes: nodes
      .filter((n) => !hidden.has(n.id))
      .map((n) => ({
        ...n,
        hidden: false as const,
        // React Flow needs explicit dimensions on the node itself
        style: {
          ...n.style,
          width: n.data.style.width,
          height: n.data.style.height,
        },
      })),
    visibleEdges: edges.filter(
      (e) => !hidden.has(e.source) && !hidden.has(e.target),
    ),
  }
}

/**
 * Central editor state: nodes, edges, history, persistence, selection,
 * clipboard and all tree operations used by the UI.
 */
export function useTreeEditor() {
  const initialProject = useRef<Project | null>(null)
  if (initialProject.current === null) {
    initialProject.current = loadStoredProject() ?? createInitialProject()
  }

  const [name, setName] = useState(initialProject.current.name)
  const [nodes, setNodes] = useState<TreeNode[]>(initialProject.current.nodes)
  const [edges, setEdges] = useState<TreeEdge[]>(initialProject.current.edges)
  const [settings, setSettings] = useState<CanvasSettings>(
    initialProject.current.settings,
  )

  const history = useHistory<Doc>((doc) => {
    setNodes(doc.nodes)
    setEdges(doc.edges)
  })
  const historyRef = useRef(history)
  historyRef.current = history

  /** Record the next document state in the undo history. */
  const commit = useCallback(
    (nextNodes: TreeNode[], nextEdges: TreeEdge[], coalesceKey?: string) => {
      historyRef.current.commit(
        { nodes: nextNodes, edges: nextEdges },
        coalesceKey,
      )
    },
    [],
  )

  const [toasts, setToasts] = useState<Toast[]>([])
  const toast = useCallback((message: string, kind: Toast['kind'] = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, kind }])
    window.setTimeout(() => {
      setToasts((t) => t.filter((entry) => entry.id !== id))
    }, 2600)
  }, [])

  /* ---------------- theme ---------------- */
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    () =>
      (localStorage.getItem(THEME_KEY) as 'light' | 'dark' | 'system') ??
      'light',
  )
  useEffect(() => {
    const root = document.documentElement
    const apply = (dark: boolean) => root.classList.toggle('dark', dark)
    localStorage.setItem(THEME_KEY, theme)
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      apply(mq.matches)
      const listener = (e: MediaQueryListEvent) => apply(e.matches)
      mq.addEventListener('change', listener)
      return () => mq.removeEventListener('change', listener)
    }
    apply(theme === 'dark')
  }, [theme])

  /* ---------------- auto-save to localStorage ---------------- */
  const [dirty, setDirty] = useState(false)
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    setDirty(true)
    const timer = window.setTimeout(() => {
      const project: Project = { name, version: 1, nodes, edges, settings }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
        setDirty(false)
      } catch {
        /* storage unavailable */
      }
    }, SAVE_DEBOUNCE)
    return () => window.clearTimeout(timer)
  }, [nodes, edges, name, settings])

  /* ---------------- mutable refs for stable callbacks ---------------- */
  const nodesRef = useRef(nodes)
  nodesRef.current = nodes
  const edgesRef = useRef(edges)
  edgesRef.current = edges

  /* ---------------- react flow handlers ---------------- */
  const rf = useReactFlow()

  const onNodesChange = useCallback(
    (changes: NodeChange<TreeNode>[]) => {
      setNodes((current) => applyNodeChanges(changes, current))
      // Persist a finished drag to history
      if (changes.some((c) => c.type === 'position' && c.dragging === false)) {
        setNodes((current) => {
          commit(current, edgesRef.current)
          return current
        })
      }
    },
    [commit],
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange<TreeEdge>[]) => {
      setEdges((current) => applyEdgeChanges(changes, current))
      if (changes.some((c) => c.type === 'remove')) {
        setEdges((current) => {
          commit(nodesRef.current, current)
          return current
        })
      }
    },
    [commit],
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      if (connection.source === connection.target) return
      // Tree invariant: each node has at most one parent
      if (edgesRef.current.some((e) => e.target === connection.target)) {
        toast('Each node can have only one parent', 'error')
        return
      }
      if (
        wouldCreateCycle(
          edgesRef.current,
          connection.source,
          connection.target,
        )
      ) {
        toast('That connection would create a cycle', 'error')
        return
      }
      const handles = canonicalHandles()
      const edge: TreeEdge = withCanonicalHandles({
        id: uid('e'),
        source: connection.source,
        target: connection.target,
        sourceHandle: handles.sourceHandle,
        targetHandle: handles.targetHandle,
        type: 'smoothstep',
        data: defaultEdgeStyle(),
      })
      const nextEdges = [...edgesRef.current, edge]
      setEdges(nextEdges)
      commit(nodesRef.current, nextEdges)
      toast('Connected', 'success')
    },
    [commit, toast],
  )

  /**
   * Drag an existing edge endpoint onto another node:
   * child keeps at most one parent and cycles are rejected.
   */
  const onReconnect = useCallback(
    (oldEdge: TreeEdge, connection: Connection) => {
      if (!connection.source || !connection.target) return
      if (connection.source === connection.target) return
      if (
        edgesRef.current.some(
          (e) => e.id !== oldEdge.id && e.target === connection.target,
        )
      ) {
        toast('Each node can have only one parent', 'error')
        return
      }
      if (
        wouldCreateCycle(
          edgesRef.current,
          connection.source,
          connection.target,
          oldEdge.id,
        )
      ) {
        toast('That connection would create a cycle', 'error')
        return
      }
      const nextEdges = edgesRef.current
        .filter((e) => e.id !== oldEdge.id)
        .concat(
          withCanonicalHandles({
            id: oldEdge.id,
            source: connection.source!,
            target: connection.target!,
            type: oldEdge.type,
            data: oldEdge.data,
          }),
        )
      setEdges(nextEdges)
      commit(nodesRef.current, nextEdges)
      toast('Reconnected', 'success')
    },
    [commit, toast],
  )

  /* ---------------- derived visible document ---------------- */
  const visibleDoc = useMemo(
    () => computeVisible(nodes, edges),
    [nodes, edges],
  )

  /* ---------------- node operations ---------------- */
  const makeNode = useCallback(
    (partial: NodeDataInput, position: { x: number; y: number }): TreeNode => ({
      id: uid(),
      type: 'treeNode',
      position,
      data: makeNodeData(partial),
    }),
    [],
  )

  const addNodeAt = useCallback(
    (partial: NodeDataInput, position: { x: number; y: number }) => {
      const node = makeNode(partial, position)
      const nextNodes = [...nodesRef.current, node]
      setNodes(nextNodes)
      commit(nextNodes, edgesRef.current)
      return node
    },
    [commit, makeNode],
  )

  /** Add a node relative to a base node and connect it appropriately. */
  const addRelative = useCallback(
    (
      baseId: string,
      relation: 'child' | 'sibling' | 'parent',
      partial: NodeDataInput = {},
    ) => {
      const base = nodesRef.current.find((n) => n.id === baseId)
      if (!base) return
      const offset =
        relation === 'child'
          ? { x: 40, y: base.data.style.height + 100 }
          : relation === 'sibling'
            ? { x: base.data.style.width + 60, y: 0 }
            : { x: 40, y: -(base.data.style.height + 100) }
      const node = makeNode(
        {
          ...partial,
          category: partial.category ?? base.data.category,
          style: { ...base.data.style, ...(partial.style ?? {}) },
        },
        { x: base.position.x + offset.x, y: base.position.y + offset.y },
      )
      const nextNodes = [...nodesRef.current, node]
      let nextEdges = [...edgesRef.current]
      if (relation === 'child') {
        nextEdges.push(makeTreeEdge(baseId, node.id))
      } else if (relation === 'sibling') {
        const parentEdge = edgesRef.current.find((e) => e.target === baseId)
        if (parentEdge) {
          nextEdges.push(makeTreeEdge(parentEdge.source, node.id))
        }
      } else {
        // New parent above base: rewire base's old parents to the new node
        const oldEdges = edgesRef.current.filter((e) => e.target === baseId)
        nextEdges = nextEdges.filter((e) => e.target !== baseId)
        nextEdges.push(makeTreeEdge(node.id, baseId))
        for (const old of oldEdges) {
          nextEdges.push(makeTreeEdge(old.source, node.id))
        }
      }
      setNodes(nextNodes.map((n) => ({ ...n, selected: n.id === node.id })))
      setEdges(nextEdges)
      commit(nextNodes, nextEdges)
      return node
    },
    [commit, makeNode],
  )

  const updateNodeData = useCallback(
    (nodeId: string, data: Partial<NodeData>, coalesceKey?: string) => {
      const nextNodes = nodesRef.current.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n,
      )
      setNodes(nextNodes)
      commit(nextNodes, edgesRef.current, coalesceKey)
    },
    [commit],
  )

  const updateNodeStyle = useCallback(
    (nodeId: string, style: Partial<NodeStyle>, coalesceKey?: string) => {
      const nextNodes = nodesRef.current.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, style: { ...n.data.style, ...style } } }
          : n,
      )
      setNodes(nextNodes)
      commit(nextNodes, edgesRef.current, coalesceKey)
    },
    [commit],
  )

  /** Apply a style/shape change to every selected node (bulk edit). */
  const bulkUpdate = useCallback(
    (style: Partial<NodeStyle>, data?: Partial<NodeData>) => {
      const selectedIds = new Set(
        nodesRef.current.filter((n) => n.selected).map((n) => n.id),
      )
      if (selectedIds.size === 0) return
      const nextNodes = nodesRef.current.map((n) => {
        if (!selectedIds.has(n.id)) return n
        return {
          ...n,
          data: {
            ...n.data,
            ...data,
            style: { ...n.data.style, ...style },
          },
        }
      })
      setNodes(nextNodes)
      commit(nextNodes, edgesRef.current)
    },
    [commit],
  )

  /* ---------------- deletion ---------------- */
  const deleteSelected = useCallback(() => {
    const nodeIds = nodesRef.current
      .filter((n) => n.selected)
      .map((n) => n.id)
    const selectedEdges = edgesRef.current.filter((e) => e.selected).length
    if (nodeIds.length === 0 && selectedEdges === 0) return
    const idSet = new Set(nodeIds)
    const nextNodes = nodesRef.current.filter((n) => !idSet.has(n.id))
    const nextEdges = edgesRef.current
      .filter((e) => !e.selected)
      .filter((e) => !idSet.has(e.source) && !idSet.has(e.target))
    setNodes(nextNodes)
    setEdges(nextEdges)
    commit(nextNodes, nextEdges)
    toast(
      `Deleted ${nodeIds.length} node${nodeIds.length === 1 ? '' : 's'}${
        selectedEdges
          ? ` and ${selectedEdges} edge${selectedEdges === 1 ? '' : 's'}`
          : ''
      }`,
    )
  }, [commit, toast])

  const deleteNodesByIds = useCallback(
    (ids: string[]) => {
      const idSet = new Set(ids)
      const nextNodes = nodesRef.current.filter((n) => !idSet.has(n.id))
      const nextEdges = edgesRef.current.filter(
        (e) => !idSet.has(e.source) && !idSet.has(e.target),
      )
      setNodes(nextNodes)
      setEdges(nextEdges)
      commit(nextNodes, nextEdges)
    },
    [commit],
  )

  /* ---------------- clipboard ---------------- */
  const clipboardRef = useRef<
    { originalId: string; data: NodeData; parentId: string | null }[]
  >([])
  const pasteCountRef = useRef(0)

  const copySelected = useCallback(() => {
    const selected = nodesRef.current.filter((n) => n.selected)
    if (selected.length === 0) return
    clipboardRef.current = selected.map((n) => ({
      originalId: n.id,
      data: JSON.parse(JSON.stringify(n.data)) as NodeData,
      parentId: edgesRef.current.find((e) => e.target === n.id)?.source ?? null,
    }))
    pasteCountRef.current = 0
    toast(`Copied ${selected.length} node${selected.length > 1 ? 's' : ''}`)
  }, [toast])

  const pasteClipboard = useCallback(
    (at?: { x: number; y: number }) => {
      const items = clipboardRef.current
      if (items.length === 0) {
        toast('Clipboard is empty')
        return
      }
      const pasteIndex = pasteCountRef.current++
      const base = at ?? { x: 24 * (pasteIndex + 1), y: 24 * (pasteIndex + 1) }
      const newNodes: TreeNode[] = []
      const newEdges: TreeEdge[] = []
      const idMap = new Map<string, string>()
      items.forEach((item, i) => {
        const id = uid()
        idMap.set(item.originalId, id)
        newNodes.push({
          id,
          type: 'treeNode',
          position: {
            x: base.x + (i % 4) * 40,
            y: base.y + Math.floor(i / 4) * 40,
          },
          data: JSON.parse(JSON.stringify(item.data)) as NodeData,
        })
      })
      // Re-link pasted nodes whose pasted parent is also in the clipboard
      items.forEach((item) => {
        if (!item.parentId) return
        const childId = idMap.get(item.originalId)
        const parentId = idMap.get(item.parentId)
        if (childId && parentId) {
          newEdges.push(makeTreeEdge(parentId, childId))
        }
      })
      const nextNodes = [...nodesRef.current, ...newNodes]
      const nextEdges = [...edgesRef.current, ...newEdges]
      setNodes(nextNodes)
      setEdges(nextEdges)
      commit(nextNodes, nextEdges)
      toast(
        `Pasted ${newNodes.length} node${newNodes.length > 1 ? 's' : ''}`,
        'success',
      )
      return newNodes
    },
    [commit, toast],
  )

  const duplicateSelected = useCallback(() => {
    copySelected()
    return pasteClipboard()
  }, [copySelected, pasteClipboard])

  /* ---------------- collapse / expand ---------------- */
  const toggleCollapse = useCallback(
    (nodeId: string) => {
      const node = nodesRef.current.find((n) => n.id === nodeId)
      if (!node) return
      const nextNodes = nodesRef.current.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, collapsed: !n.data.collapsed } }
          : n,
      )
      setNodes(nextNodes)
      commit(nextNodes, edgesRef.current)
    },
    [commit],
  )

  /* ---------------- auto layout ---------------- */
  const applyAutoLayout = useCallback(
    (direction?: LayoutDirection) => {
      const dir = direction ?? settings.layoutDirection
      const nextNodes = autoLayout(nodesRef.current, edgesRef.current, dir)
      setNodes(nextNodes)
      if (direction && direction !== settings.layoutDirection) {
        setSettings((s) => ({ ...s, layoutDirection: direction }))
      }
      commit(nextNodes, edgesRef.current)
      window.setTimeout(() => rf.fitView({ padding: 0.15, duration: 400 }), 30)
      toast('Layout applied', 'success')
    },
    [commit, rf, settings.layoutDirection, toast],
  )

  /* ---------------- selection helpers ---------------- */
  const selectNode = useCallback((nodeId: string | null) => {
    setNodes((current) =>
      current.map((n) => ({ ...n, selected: n.id === nodeId })),
    )
  }, [])

  const selectAll = useCallback(() => {
    setNodes((current) => current.map((n) => ({ ...n, selected: true })))
    setEdges((current) => current.map((e) => ({ ...e, selected: true })))
  }, [])

  const clearSelection = useCallback(() => {
    setNodes((current) =>
      current.map((n) => (n.selected ? { ...n, selected: false } : n)),
    )
    setEdges((current) =>
      current.map((e) => (e.selected ? { ...e, selected: false } : e)),
    )
  }, [])

  const centerOnNode = useCallback(
    (nodeId: string) => {
      const node = nodesRef.current.find((n) => n.id === nodeId)
      if (!node) return
      selectNode(nodeId)
      rf.setCenter(
        node.position.x + node.data.style.width / 2,
        node.position.y + node.data.style.height / 2,
        { zoom: 1.1, duration: 500 },
      )
    },
    [rf, selectNode],
  )

  /** Highlight all title matches for the search box and center the first */
  const highlightSearch = useCallback(
    (query: string) => {
      const q = query.trim().toLowerCase()
      if (!q) {
        setNodes((current) =>
          current.map((n) =>
            n.data.highlightedAt
              ? { ...n, data: { ...n.data, highlightedAt: undefined } }
              : n,
          ),
        )
        return
      }
      const matches = nodesRef.current.filter((n) =>
        n.data.title.toLowerCase().includes(q),
      )
      setNodes((current) =>
        current.map((n) => {
          const marked = n.data.title.toLowerCase().includes(q)
            ? Date.now()
            : undefined
          if (n.data.highlightedAt === marked) return n
          return { ...n, data: { ...n.data, highlightedAt: marked } }
        }),
      )
      if (matches.length > 0) centerOnNode(matches[0].id)
      else toast('No matching node')
    },
    [centerOnNode, toast],
  )

  /* ---------------- edge operations ---------------- */
  const updateEdge = useCallback(
    (edgeId: string, style: Partial<EdgeStyleData>, coalesceKey?: string) => {
      const next = edgesRef.current.map((e) => {
        if (e.id !== edgeId) return e
        const data = { ...defaultEdgeStyle(), ...e.data, ...style }
        return { ...e, data, type: rfEdgeType(data.type) } as TreeEdge
      })
      setEdges(next)
      commit(nodesRef.current, next, coalesceKey)
    },
    [commit],
  )

  const updateSelectedEdges = useCallback(
    (style: Partial<EdgeStyleData>) => {
      const next = edgesRef.current.map((e) => {
        if (!e.selected) return e
        const data = { ...defaultEdgeStyle(), ...e.data, ...style }
        return { ...e, data, type: rfEdgeType(data.type) } as TreeEdge
      })
      setEdges(next)
      commit(nodesRef.current, next)
    },
    [commit],
  )

  /* ---------------- node position (properties panel) ---------------- */
  const updateNodePosition = useCallback(
    (nodeId: string, x: number, y: number) => {
      const nextNodes = nodesRef.current.map((n) =>
        n.id === nodeId ? { ...n, position: { x, y } } : n,
      )
      setNodes(nextNodes)
      commit(nextNodes, edgesRef.current)
    },
    [commit],
  )

  /* ---------------- project operations ---------------- */
  const replaceProject = useCallback(
    (project: {
      name?: string
      nodes: TreeNode[]
      edges: TreeEdge[]
      settings?: CanvasSettings
    }) => {
      setNodes(project.nodes)
      setEdges(project.edges)
      if (project.settings) setSettings(project.settings)
      if (project.name) setName(project.name)
      commit(project.nodes, project.edges)
      window.setTimeout(() => rf.fitView({ padding: 0.15, duration: 400 }), 30)
    },
    [commit, rf],
  )

  const clearCanvas = useCallback(() => {
    replaceProject({ nodes: [], edges: [] })
    toast('Canvas cleared')
  }, [replaceProject, toast])

  /* ---------------- align / distribute (multi selection) ---------------- */
  const alignSelected = useCallback(
    (mode: 'left' | 'right' | 'top' | 'bottom' | 'center-h' | 'center-v') => {
      const selected = nodesRef.current.filter((n) => n.selected)
      if (selected.length < 2) return
      const xs = selected.map((n) => n.position.x)
      const ys = selected.map((n) => n.position.y)
      let target: number
      switch (mode) {
        case 'left':
          target = Math.min(...xs)
          break
        case 'right':
          target = Math.max(...xs)
          break
        case 'top':
          target = Math.min(...ys)
          break
        case 'bottom':
          target = Math.max(...ys)
          break
        case 'center-h':
          target = (Math.min(...xs) + Math.max(...xs)) / 2
          break
        case 'center-v':
          target = (Math.min(...ys) + Math.max(...ys)) / 2
          break
      }
      const nextNodes = nodesRef.current.map((n) => {
        if (!n.selected) return n
        if (mode === 'left' || mode === 'right' || mode === 'center-h') {
          return { ...n, position: { ...n.position, x: target } }
        }
        return { ...n, position: { ...n.position, y: target } }
      })
      setNodes(nextNodes)
      commit(nextNodes, edgesRef.current)
    },
    [commit],
  )

  const distributeSelected = useCallback(
    (axis: 'h' | 'v') => {
      const selected = nodesRef.current.filter((n) => n.selected)
      if (selected.length < 3) {
        toast('Select at least 3 nodes to distribute')
        return
      }
      const sorted = [...selected].sort((a, b) =>
        axis === 'h'
          ? a.position.x - b.position.x
          : a.position.y - b.position.y,
      )
      const first = sorted[0]
      const last = sorted[sorted.length - 1]
      const span =
        axis === 'h'
          ? last.position.x - first.position.x
          : last.position.y - first.position.y
      const step = span / (sorted.length - 1)
      const offsets = new Map(
        sorted.map((n, i) => [
          n.id,
          axis === 'h'
            ? first.position.x + i * step
            : first.position.y + i * step,
        ]),
      )
      const nextNodes = nodesRef.current.map((n) => {
        const value = offsets.get(n.id)
        if (value === undefined) return n
        return axis === 'h'
          ? { ...n, position: { ...n.position, x: value } }
          : { ...n, position: { ...n.position, y: value } }
      })
      setNodes(nextNodes)
      commit(nextNodes, edgesRef.current)
    },
    [commit, toast],
  )

  /* ---------------- viewport helpers ---------------- */
  const zoomIn = useCallback(() => rf.zoomIn({ duration: 200 }), [rf])
  const zoomOut = useCallback(() => rf.zoomOut({ duration: 200 }), [rf])
  const fitView = useCallback(
    () => rf.fitView({ padding: 0.2, duration: 300 }),
    [rf],
  )
  /** Flow coordinates of the center of the visible viewport. */
  const viewportCenter = useCallback(() => {
    const container = document.querySelector('.react-flow')
    if (container) {
      const rect = container.getBoundingClientRect()
      return rf.screenToFlowPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      })
    }
    return rf.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    })
  }, [rf])

  return {
    // document
    name,
    rename: setName,
    nodes,
    edges,
    settings,
    setSettings,
    visibleDoc,
    // history
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    // react flow handlers
    onNodesChange,
    onEdgesChange,
    onConnect,
    onReconnect,
    // node operations
    addNodeAt,
    addRelative,
    updateNodeData,
    updateNodeStyle,
    updateNodePosition,
    bulkUpdate,
    deleteSelected,
    deleteNodesByIds,
    copySelected,
    pasteClipboard,
    duplicateSelected,
    toggleCollapse,
    // layout & selection
    applyAutoLayout,
    selectNode,
    selectAll,
    clearSelection,
    centerOnNode,
    highlightSearch,
    alignSelected,
    distributeSelected,
    // edges
    updateEdge,
    updateSelectedEdges,
    // project
    replaceProject,
    clearCanvas,
    dirty,
    // viewport
    zoomIn,
    zoomOut,
    fitView,
    viewportCenter,
    // ui
    toasts,
    toast,
    theme,
    setTheme,
  }
}

export type TreeEditor = ReturnType<typeof useTreeEditor>










