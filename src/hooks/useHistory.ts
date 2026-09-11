import { useCallback, useRef, useState } from 'react'

export interface HistorySnapshot<T> {
  value: T
  /** Coalescing key: commits with the same key within the window merge */
  key?: string
  time: number
}

const COALESCE_WINDOW = 600

/**
 * Simple undo/redo history for an immutable document value.
 * The caller owns storing the document; history only keeps snapshots.
 */
export function useHistory<T>(apply: (value: T) => void) {
  const [state, setState] = useState<{ stack: HistorySnapshot<T>[]; index: number }>({
    stack: [],
    index: -1,
  })
  const stateRef = useRef(state)
  stateRef.current = state

  const commit = useCallback(
    (value: T, coalesceKey?: string) => {
      const entry: HistorySnapshot<T> = { value, key: coalesceKey, time: Date.now() }
      setState((prev) => {
        const top = prev.stack[prev.index]
        const merge =
          top &&
          coalesceKey &&
          top.key === coalesceKey &&
          entry.time - top.time < COALESCE_WINDOW
        const stack = merge
          ? [...prev.stack.slice(0, prev.index), entry]
          : [...prev.stack.slice(0, prev.index + 1), entry]
        // Cap the history at 100 entries
        const trimmed = stack.length > 100 ? stack.slice(stack.length - 100) : stack
        return { stack: trimmed, index: trimmed.length - 1 }
      })
    },
    [],
  )

  const undo = useCallback(() => {
    const { stack, index } = stateRef.current
    if (index <= 0) return false
    const newIndex = index - 1
    setState({ stack, index: newIndex })
    apply(stack[newIndex].value)
    return true
  }, [apply])

  const redo = useCallback(() => {
    const { stack, index } = stateRef.current
    if (index >= stack.length - 1) return false
    const newIndex = index + 1
    setState({ stack, index: newIndex })
    apply(stack[newIndex].value)
    return true
  }, [apply])

  const reset = useCallback((value: T) => {
    setState({ stack: [{ value, time: Date.now() }], index: 0 })
  }, [])

  return {
    commit,
    undo,
    redo,
    reset,
    canUndo: state.index > 0,
    canRedo: state.index < state.stack.length - 1,
  }
}
