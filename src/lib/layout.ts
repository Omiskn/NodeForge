import dagre from '@dagrejs/dagre'
import type { LayoutDirection, TreeNode, TreeEdge } from '@/types'

/**
 * Auto-layout the tree with dagre.
 * Produces the classic organization-chart appearance:
 * parents above (or beside) children, siblings evenly spaced.
 */
export function autoLayout(
  nodes: TreeNode[],
  edges: TreeEdge[],
  direction: LayoutDirection,
): TreeNode[] {
  if (nodes.length === 0) return nodes

  const graph = new dagre.graphlib.Graph()
  graph.setGraph({
    rankdir: direction,
    nodesep: 48,
    ranksep: direction === 'TB' || direction === 'BT' ? 90 : 140,
    marginx: 40,
    marginy: 40,
  })
  graph.setDefaultEdgeLabel(() => ({}))

  for (const node of nodes) {
    graph.setNode(node.id, {
      width: node.data.style.width,
      height: node.data.style.height,
    })
  }
  for (const edge of edges) {
    // Ignore edges pointing at hidden (collapsed) nodes for a tidy layout
    if (!nodes.some((n) => n.id === edge.target)) continue
    graph.setEdge(edge.source, edge.target)
  }

  dagre.layout(graph)

  return nodes.map((node) => {
    const pos = graph.node(node.id)
    if (!pos) return node
    return {
      ...node,
      position: {
        x: pos.x - node.data.style.width / 2,
        y: pos.y - node.data.style.height / 2,
      },
    }
  })
}
