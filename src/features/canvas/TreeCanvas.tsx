import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  useReactFlow,
  type NodeMouseHandler,
} from '@xyflow/react'
import type { TreeEditor } from '@/hooks/useTreeEditor'
import TreeNodeComponent from '@/features/nodes/TreeNodeComponent'
import {
  ContextMenu,
  type ContextMenuActions,
  type ContextMenuState,
} from './ContextMenu'
import type { TreeEdge, NodeShape } from '@/types'

const nodeTypes = { treeNode: TreeNodeComponent }

/** Drag payload key used by the sidebar node templates */
export const SHAPE_DRAG_MIME = 'application/nodetree-shape'

/** Map edge data to React Flow edge presentation (stroke, marker, animation). */
function styledEdge(edge: TreeEdge): TreeEdge {
  const data = edge.data
  return {
    ...edge,
    style: {
      stroke: data?.color ?? 'var(--muted-foreground)',
      strokeWidth: data?.width ?? 1.5,
    },
    animated: data?.animated ?? false,
    markerEnd: data?.arrow
      ? {
          type: MarkerType.ArrowClosed,
          color: data.color,
          width: 16,
          height: 16,
        }
      : undefined,
  }
}

function TreeCanvas({ editor }: { editor: TreeEditor }) {
  const rf = useReactFlow()
  const [menu, setMenu] = useState<ContextMenuState | null>(null)
  const [flowPos, setFlowPos] = useState({ x: 0, y: 0 })

  const nodes = editor.visibleDoc.visibleNodes
  const edges = useMemo(
    () => editor.visibleDoc.visibleEdges.map(styledEdge),
    [editor.visibleDoc.visibleEdges],
  )

  /* Collapse toggle events emitted by the node component */
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<string>).detail
      editor.toggleCollapse(id)
    }
    window.addEventListener('nodetree:toggle-collapse', handler)
    return () => window.removeEventListener('nodetree:toggle-collapse', handler)
  }, [editor])

  /* ---------------- drag & drop from sidebar ---------------- */
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const shape = event.dataTransfer.getData(SHAPE_DRAG_MIME)
      if (!shape) return
      const position = rf.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      editor.addNodeAt(
        { shape: shape as NodeShape, title: 'New Node' },
        position,
      )
    },
    [editor, rf],
  )

  /* ---------------- context menus ---------------- */
  const onNodeContextMenu: NodeMouseHandler = useCallback((event, node) => {
    event.preventDefault()
    setFlowPos({ x: 0, y: 0 })
    setMenu({ x: event.clientX, y: event.clientY, kind: 'node', nodeId: node.id })
  }, [])

  const onPaneContextMenu = useCallback(
    (event: { clientX: number; clientY: number; preventDefault(): void }) => {
      event.preventDefault()
      const position = rf.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      setFlowPos(position)
      setMenu({ x: event.clientX, y: event.clientY, kind: 'pane' })
    },
    [rf],
  )

  const menuActions: ContextMenuActions = useMemo(
    () => ({
      onEdit: (nodeId) => {
        editor.selectNode(nodeId)
        window.setTimeout(() => {
          document.getElementById('prop-title-input')?.focus()
        }, 60)
      },
      onDuplicate: () => {
        editor.duplicateSelected()
      },
      onAddChild: (nodeId) => editor.addRelative(nodeId, 'child'),
      onAddSibling: (nodeId) => editor.addRelative(nodeId, 'sibling'),
      onAddParent: (nodeId) => editor.addRelative(nodeId, 'parent'),
      onCopy: () => editor.copySelected(),
      onPaste: (at) => editor.pasteClipboard(at),
      onDelete: (nodeId) => {
        editor.selectNode(nodeId)
        editor.deleteSelected()
      },
      onChangeColor: (nodeId, color) =>
        editor.updateNodeStyle(nodeId, { background: color }),
      onChangeShape: (nodeId, shape) => editor.updateNodeData(nodeId, { shape }),
      onAddNode: (at) => editor.addNodeAt({ title: 'New Node' }, at),
      onSelectAll: () => editor.selectAll(),
      onFitView: () => editor.fitView(),
      onAutoLayout: () => editor.applyAutoLayout(),
    }),
    [editor],
  )

  const isEmpty = nodes.length === 0

  return (
    <div className="relative h-full w-full flex-1">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={editor.onNodesChange}
        onEdgesChange={editor.onEdgesChange}
        onConnect={editor.onConnect}
        onReconnect={editor.onReconnect}
        reconnectRadius={10}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        deleteKeyCode={null}
        multiSelectionKeyCode="Shift"
        selectionKeyCode="Shift"
        minZoom={0.1}
        maxZoom={2.5}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        className="bg-[var(--background)]"
      >
        {editor.settings.showGrid ? (
          <Background
            variant={BackgroundVariant.Dots}
            gap={22}
            size={1.4}
            color="var(--canvas-dot)"
          />
        ) : null}
        <Controls
          showInteractive={false}
          className="!rounded-lg !border-[var(--border)] !shadow-[var(--shadow-md-soft)] [&>button]:!border-[var(--border)] [&>button]:!bg-[var(--card)] [&>button]:!text-[var(--muted-foreground)] [&>button:hover]:!text-[var(--foreground)]"
        />
        <MiniMap
          pannable
          zoomable
          className="!rounded-lg !border-[var(--border)] !bg-[var(--card)] !shadow-[var(--shadow-md-soft)]"
          nodeColor={(node) => (node.selected ? '#10b981' : '#94a3b8')}
        />
      </ReactFlow>

      {/* Empty state */}
      {isEmpty ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)]/80 px-10 py-8 text-center shadow-[var(--shadow-sm-soft)]">
            <p className="text-sm font-medium text-[var(--foreground)]">
              Your canvas is empty
            </p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Drag a node shape from the sidebar or pick a ready-made template
              to get started.
            </p>
          </div>
        </div>
      ) : null}

      {/* Right-click context menu */}
      {menu ? (
        <ContextMenu
          state={menu}
          actions={menuActions}
          flowPosition={flowPos}
          onClose={() => setMenu(null)}
        />
      ) : null}
    </div>
  )
}

export default TreeCanvas


