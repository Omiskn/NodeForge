import { defaultEdgeStyle } from "@/data/edgeStyles";
import { makeNodeData, defaultNodeStyle } from "@/data/nodeStyles";
import { rfEdgeType } from "@/hooks/useTreeEditor";
import type {
  CanvasSettings,
  LegendConfig,
  Project,
  TreeEdge,
  TreeNode,
} from "@/types";

export function defaultCanvasSettings(): CanvasSettings {
  return {
    showGrid: true,
    layoutDirection: "TB",
    showLegend: false,
    legendPosition: "bottom-right",
    focusGroup: null,
  };
}

function normalizeSettings(
  input: Partial<CanvasSettings> | undefined,
): CanvasSettings {
  return { ...defaultCanvasSettings(), ...input };
}

/** Export the project as a pretty-printed JSON string. */
export function serializeProject(project: Project): string {
  return JSON.stringify(project, null, 2);
}

/**
 * Parse and normalize an imported project so that older/partial files
 * still load correctly (fills in defaults for style fields, etc.).
 * Returns null when the file is not a valid NodeTree project.
 */
export function parseImportedProject(raw: string): Project | null {
  try {
    const data = JSON.parse(raw) as Partial<Project>;
    if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) return null;

    const nodes: TreeNode[] = data.nodes.map((node) => {
      const nodeStyle = { ...defaultNodeStyle(), ...node.data?.style };
      return {
        id: node.id,
        type: "treeNode" as const,
        position: { x: node.position?.x ?? 0, y: node.position?.y ?? 0 },
        data: makeNodeData({
          ...node.data,
          style: nodeStyle,
          isGroup: node.data?.isGroup ?? node.data?.shape === "group",
        }),
        selected: false,
      };
    });

    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges: TreeEdge[] = data.edges
      .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map((e) => {
        const edgeData = { ...defaultEdgeStyle(), ...e.data };
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          type: rfEdgeType(edgeData.type),
          data: edgeData,
          selected: false,
        };
      });

    return {
      name:
        typeof data.name === "string" && data.name
          ? data.name
          : "Imported Tree",
      version: 1,
      nodes,
      edges,
      settings: normalizeSettings(data.settings),
      legend: normalizeLegend(data.legend),
    };
  } catch {
    return null;
  }
}

function normalizeLegend(input: LegendConfig | undefined): LegendConfig {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { labels: {} };
  }
  const labels: Record<string, string> = {};
  for (const [key, value] of Object.entries(input.labels ?? {})) {
    if (typeof value === "string" && value.trim()) labels[key] = value;
  }
  return { labels };
}
