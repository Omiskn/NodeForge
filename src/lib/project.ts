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

const NODETREE_MIME = "application/x-nodetree";
const NODETREE_EXT = ".nodetree";

/** Encode a project for file storage (same shape as localStorage, persisted as JSON). */
export function encodeProject(project: Project): string {
  return serializeProject(project);
}

/**
 * Try to save a project to a real file using the File System Access API.
 * Falls back to a download when the API is unavailable or the user cancels.
 */
export async function saveProject(
  project: Project,
  defaultName: string,
): Promise<boolean> {
  const text = encodeProject(project);
  const base = (defaultName || "project").replace(/\s+/g, "-").toLowerCase() || "project";
  const filename = base.endsWith(NODETREE_EXT) ? base : base + NODETREE_EXT;

  if (typeof window === "undefined") return downloadProject(text, filename);

  try {
    if (!("showSaveFilePicker" in window)) {
      return downloadProject(text, filename);
    }
    const win = window as unknown as {
      showSaveFilePicker(
        opts: {
          suggestedName: string;
          types: Array<{
            description: string;
            accept: Record<string, string[]>;
          }>;
        },
      ): Promise<{
        getFile(): Promise<File>;
        createWritable(): Promise<{
          write(data: string): Promise<void>;
          close(): Promise<void>;
        }>;
      }>;
    };
    const opts = {
      suggestedName: filename,
      types: [
        {
          description: "NodeTree project",
          accept: { [NODETREE_MIME]: [NODETREE_EXT, ".json"] },
        },
      ],
    };
    const handle = await win.showSaveFilePicker(opts);
    const writable = await handle.createWritable();
    await writable.write(text);
    await writable.close();
    return true;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      (error as { name: string }).name === "AbortError"
    ) {
      return false;
    }
    return downloadProject(text, filename);
  }
}

/** Fallback: download the project as a .nodetree file. */
export function downloadProject(text: string, filename: string): boolean {
  const blob = new Blob([text], { type: NODETREE_MIME });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  return true;
}

/**
 * Try to load a project from a real file using the File System Access API.
 * Falls back to a picker input when the API is unavailable.
 *
 * `apply` receives the parsed Project (or null on failure) and is responsible
 * for replacing state / showing toasts.
 */
export async function loadProject(
  apply: (project: Project | null) => void,
): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    if (!("showOpenFilePicker" in window)) {
      return false;
    }
    const win = window as unknown as {
      showOpenFilePicker(
        opts: {
          types: Array<{
            description: string;
            accept: Record<string, string[]>;
          }>;
          multiple: boolean;
        },
      ): Promise<Array<{ getFile(): Promise<File> }>>;
    };
    const opts = {
      types: [
        {
          description: "NodeTree project",
          accept: { [NODETREE_MIME]: [NODETREE_EXT, ".json"] },
        },
      ],
      multiple: false,
    };
    const [handle] = await win.showOpenFilePicker(opts);
    const file = await handle.getFile();
    const text = await file.text();
    const project = parseImportedProject(text);
    apply(project);
    return true;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      (error as { name: string }).name === "AbortError"
    ) {
      return false;
    }
    return false;
  }
}

/** Open the legacy file-input picker as a fallback for loading. */
export function openLegacyFilePicker(): void {
  // Triggering the hidden input is handled by the caller.
}
