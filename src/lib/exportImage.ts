import { getNodesBounds, getViewportForBounds } from '@xyflow/react'
import { toPng, toSvg } from 'html-to-image'
import type { TreeNode } from '@/types'

/** Trigger a browser download for a data URL. */
function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}

/** Trigger a browser download for a plain-text file. */
export function downloadText(text: string, filename: string, mime: string) {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  downloadDataUrl(url, filename)
  URL.revokeObjectURL(url)
}

/**
 * Export the canvas as PNG or SVG using html-to-image over the
 * React Flow viewport, framed around the current node bounds.
 */
export async function exportImage(
  nodes: TreeNode[],
  format: 'png' | 'svg',
): Promise<void> {
  const viewportEl = document.querySelector('.react-flow__viewport')
  if (!(viewportEl instanceof HTMLElement)) {
    throw new Error('Canvas is not ready yet')
  }
  if (nodes.length === 0) {
    throw new Error('Nothing to export — the canvas is empty')
  }

  const bounds = getNodesBounds(nodes)
  const width = Math.min(4200, Math.max(900, Math.round(bounds.width + 200)))
  const height = Math.min(4200, Math.max(700, Math.round(bounds.height + 200)))
  const viewport = getViewportForBounds(bounds, width, height, 0.2, 2.5, 0.1)

  const background = getComputedStyle(document.documentElement)
    .getPropertyValue('--background')
    .trim() || '#f6f7f8'

  const options = {
    backgroundColor: background,
    width,
    height,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
    },
  }

  const dataUrl =
    format === 'png'
      ? await toPng(viewportEl, options)
      : await toSvg(viewportEl, options)
  downloadDataUrl(dataUrl, `nodetree-${Date.now()}.${format}`)
}
