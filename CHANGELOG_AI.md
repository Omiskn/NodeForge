# AI Progress Log

Handoff file for AI agents. Read `AGENTS.md` first for architecture, conventions, and rules. Update this file at the end of every substantial task.

## Current State

### Project Status

**Feature-complete v0.1 + Feature 1 complete.** NodeTree builds cleanly (`npx tsc -b` 0 errors, `vite build` succeeds in ~1.0s), `main` is synced with `origin/main`, and the working tree is clean except for one pre-existing unrelated modified file (`src/data/templates.ts` — untouched by this work). Feature 1 (connection direction) is committed as `53ae57b` and pushed.

### Completed

- Full editor shell: top toolbar, left node sidebar, React Flow canvas (pan/zoom/drag/box-select), right properties panel; responsive drawers on small screens
- 8 node shapes (rectangle, rounded, pill, circle, diamond, hexagon, card, group) with live-styled rendering (icon, avatar, title/subtitle/description, colors, border, shadow, opacity, size, typography, alignment)
- Hierarchy ops: Add Parent/Child/Sibling (with parent rewiring), connect-by-handle (one-parent invariant), collapsible branches, group containers
- Auto-layout via dagre (TB/BT/LR/RL) + context menus (node & pane) that close on action and on outside press
- Undo/redo (snapshot history with coalescing), delete, copy/paste/duplicate (subtree links preserved), multi-select bulk edit + align/distribute
- Search (highlight + center), localStorage auto-save + manual save, 7 templates + demo tree, confirm dialogs, toasts, tooltips
- Import/Export: JSON (normalized), PNG/SVG (html-to-image); light/dark/system theme via CSS variables
- Keyboard shortcuts: Del/Backspace, Ctrl+Z/Shift+Z/Y, Ctrl+C/V/D/A, Escape
- **Feature 1 — Fix connection direction:** parent→child edges now always use BOTTOM source handle → TOP target handle. New `src/lib/edgeHandles.ts` provides canonical handles + cycle detection. `onConnect` and new `onReconnect` are cycle-aware and reject self-loops. Handles styled as visible emerald dots (`.tree-handle`) on hover/selection.

### In Progress

Nothing — Feature 1 done and pushed. Remaining features from the task list (2–7) still pending:
2. Improve Add Node + node relationships (standalone node button added; full Add Parent/Child/Sibling/Unconnected UI in LeftSidebar pending)
3. Real `.nodetree` project file save/load (File System Access API + fallback download)
4. Print / PDF (print-specific CSS, hide editor UI)
5. Legend system (auto-detected color/category legend, position, editable labels, canvas/image/print)
6. Group/filter nodes by color/category (visual highlight + filter, no merge)
7. Polish and integration fixups

### Next Steps

1. Finish Feature 2: add Add Parent/Add Child/Add Sibling/Unconnected node choices in the LeftSidebar when a node is selected; confirm standalone node button works; reconnect-by-drag already wired in TreeCanvas (`onReconnect`).
2. Feature 3: implement `.nodetree` save (File System Access API with download fallback) and load (file picker → `parseImportedProject`). Keep localStorage as autosave recovery only.
3. Feature 4: add print/PDF path — print-specific CSS that hides toolbar, sidebars, panel, grid, selection outlines; landscape `@page`; optionally use html-to-image for a PDF-png fallback.
4. Feature 5: legend component rendered as an overlay in TreeCanvas (respects `settings.showLegend` + `settings.legendPosition`); auto-detect categories/colors from nodes; editable label overrides stored in `project.legend.labels`; include legend in PNG/SVG/print snapshots.
5. Feature 6: color/category grouping panel — highlight group, filter to a group, "show all"; use `NodeData.category` + color; do not merge/reposition nodes.
6. After each feature: `npx tsc -b` (must be 0 errors), `npx vite build`, update CHANGELOG_AI.md, inspect `git diff`, commit with focused message, push to `origin/main`.

### Known Issues

- Bundle size warning: single JS chunk ≈ 579 kB minified (182 kB gzip) — cosmetic build warning only.
- `package.json` name is still the template default (`vite-react-ts-template`).
- No automated tests exist.
- Pasting a multi-node subtree only re-links nodes whose parent was also copied (title/id mapping based on clipboard contents).
- Group nodes are visual containers only (no spatial containment / collapse of spatial children).
- Diamond/hexagon nodes approximate borders via clip-path layers; very thick borders may look slightly inset.

### Important Decisions

- All editor state is centralized in `useTreeEditor` (single `editor` object passed via props). Do not add global stores.
- Node dimensions live in `data.style` and are mirrored onto `node.style` in `computeVisible()` — required by React Flow.
- React Flow's built-in delete is disabled (`deleteKeyCode={null}`); deletion is handled globally in `App.tsx` so it is undoable.
- Edge visuals are mapped from `edge.data` in `TreeCanvas.styledEdge()`; `EdgeStyleData.type` maps to React Flow edge types via `rfEdgeType()` (bezier → 'default').
- Connection direction is now canonical and enforced: every hierarchy edge uses source handle `s-b` (bottom) → target handle `t-t` (top), set by `withCanonicalHandles()` in `onConnect` and `onReconnect`. Do not reintroduce `connection.sourceHandle`/`connection.targetHandle` passthrough for hierarchy edges.
- Cycle detection via `wouldCreateCycle()` (DFS over parent→child edges) is enforced in both `onConnect` and `onReconnect`; it ignores the edge being reconnected.
- localStorage schema: `nodetree:project:v1` = `{ name, version: 1, nodes, edges, settings, legend? }`; imports normalized by `parseImportedProject`.
- Commit style: small focused commits, imperative messages, push to `origin/main`.

### Recently Changed Files

- `src/lib/edgeHandles.ts` — new file: canonical handles (`s-b`/`t-t`), `withCanonicalHandles()`, `wouldCreateCycle()` cycle detection.
- `src/hooks/useTreeEditor.ts` — cycle-aware `onConnect`, new `onReconnect` (drag reconnection), `addNodeAt()`, `viewportCenter()`, `bulkUpdate()` API fix; `makeTreeEdge()` helper.
- `src/features/nodes/TreeNodeComponent.tsx` — handles styled as visible `.tree-handle` dots (opacity 0 by default, shown on hover/selection/connecting).
- `src/features/canvas/TreeCanvas.tsx` — added `onReconnect` + `reconnectRadius={10}`.
- `src/index.css` — `.react-flow__handle.tree-handle` CSS (emerald dot, appears on hover/selection).
- `src/types/index.ts` — added `category` on `NodeData`; `LegendPosition`, `LegendConfig`, `showLegend`/`legendPosition`/`focusGroup` on `CanvasSettings`; `legend?` on `Project`.
- `src/data/nodeStyles.ts` — `category` field in `NodeDataInput` + `makeNodeData`.
- `src/data/edgeStyles.ts` — added `defaultCanvasSettings()` factory.
- `src/lib/project.ts` — uses `defaultCanvasSettings()` via local def; normalizes `legend` via `normalizeLegend()`.
- `src/features/properties/PropertiesPanel.tsx` — `bulkUpdate` call fixed to pass `{ shape }` object.
- `src/features/sidebar/LeftSidebar.tsx` — added "Standalone Node" button (adds node at viewport center); layout text improved.
- Commit `53ae57b` — "feat: fix node connection direction (parent-bottom to child-top) with cycle-aware connect/reconnect".

### Git Checkpoint

- Branch `main`, clean working tree (one pre-existing unrelated modified file: `src/data/templates.ts` — untouched).
- Latest: `53ae57b` — "feat: fix node connection direction (parent-bottom to child-top) with cycle-aware connect/reconnect"
- Before that: `d4cd2fc` — AI handoff checkpoint; `721f9be` — AGENTS.md + CHANGELOG_AI.md; `4de2f52` — context menu fix; `51ed50c` — full NodeTree editor; `cdb1cf8` — initial Vite template.

### Do Not Change

Without a strong, documented reason, do not modify: `useTreeEditor`'s return API and its persistence layer; `computeVisible()` dimension syncing; the `deleteKeyCode={null}` + global keyboard-delete design; `src/index.css` theme variables; the `Project` JSON schema; tsconfig strict flags; the one-parent-per-child invariant; the canonical bottom→top connection model now enforced by `edgeHandles.ts`.
