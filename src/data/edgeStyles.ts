import type { CanvasSettings, EdgeStyleData } from '@/types'

/** Default clean org-chart connector style. */
export function defaultEdgeStyle(): EdgeStyleData {
  return {
    color: 'var(--muted-foreground)',
    width: 1.5,
    type: 'smoothstep',
    animated: false,
    arrow: false,
  }
}

/** Default canvas settings (also fills in older saved projects). */
export function defaultCanvasSettings(): CanvasSettings {
  return {
    showGrid: true,
    layoutDirection: 'TB',
    showLegend: false,
    legendPosition: 'bottom-right',
    focusGroup: null,
  }
}

export const edgeTypeOptions: { value: EdgeStyleData['type']; label: string }[] = [
  { value: 'smoothstep', label: 'Smooth Step' },
  { value: 'bezier', label: 'Bezier' },
  { value: 'straight', label: 'Straight' },
  { value: 'step', label: 'Orthogonal' },
]
