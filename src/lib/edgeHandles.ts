import type { TreeEdge } from '@/types'

/**
 * Canonical connection points for hierarchy edges:
 * the line always leaves the parent from the BOTTOM and enters
 * the child from the TOP, regardless of which handle was dragged.
 */
export const SOURCE_HANDLE_ID = 's-b'
export const TARGET_HANDLE_ID = 't-t'

export function canonicalHandles(): {
  sourceHandle: string
  targetHandle: string
} {
  return { sourceHandle: SOURCE_HANDLE_ID, targetHandle: TARGET_HANDLE_ID }
}

/** Assign the canonical parent-bottom → child-top handles to an edge. */
export function withCanonicalHandles<T extends TreeEdge>(edge: T): T {
  return {
    ...edge,
    sourceHandle: SOURCE_HANDLE_ID,
    targetHandle: TARGET_HANDLE_ID,
  }
}

/**
 * True when adding `source → target` would create a directed cycle
 * (there is already a path from `target` back to `source`).
 * `ignoreEdgeId` excludes an edge being replaced (reconnect case).
 */
export function wouldCreateCycle(
  edges: Pick<TreeEdge, 'id' | 'source' | 'target'>[],
  source: string,
  target: string,
  ignoreEdgeId?: string,
): boolean {
  if (!source || !target || source === target) return true
  const childrenOf = new Map<string, string[]>()
  for (const edge of edges) {
    if (edge.id === ignoreEdgeId) continue
    const list = childrenOf.get(edge.source) ?? []
    list.push(edge.target)
    childrenOf.set(edge.source, list)
  }
  const seen = new Set<string>([target])
  const stack = [target]
  while (stack.length > 0) {
    const current = stack.pop() as string
    if (current === source) return true
    for (const child of childrenOf.get(current) ?? []) {
      if (!seen.has(child)) {
        seen.add(child)
        stack.push(child)
      }
    }
  }
  return false
}
