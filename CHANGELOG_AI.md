# AI Progress Log

Handoff file for AI agents. Read `AGENTS.md` first for architecture, conventions, and rules. Update this file at the end of every substantial task.

## Current State

### Project Status

**Feature-complete v0.1 + Features 1–4 complete.** NodeTree builds cleanly (`npx tsc -b` 0 errors, `vite build` succeeds in ~1.0s), `main` is synced with `origin/main`, and the working tree is clean. Feature 1 (connection direction) is `53ae57b`; Feature 2 (relationship picker) is `07d6c9d`; templates.ts canonical-handle refinement is `ffc258e`; Feature 3 (.nodetree save/load) is `8364614`; Feature 4 (print/PDF) is `f4cfe74`. All pushed.

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
- **Feature 2 — Relationship picker for Add Node:** the LeftSidebar "Hierarchy" section now lets the user choose how a new node relates to the selected node: Add Child, Add Sibling, Add Parent, or Add Unlinked (no connection). A relationship-picker control (4 buttons) replaces the old 3 fixed buttons, and the add button is disabled until a relationship is chosen. "Standalone Node" still adds at viewport center. Re-connect-by-drag already wired in TreeCanvas (`onReconnect`).
- **Feature 3 — Real .nodetree project save/load:** the toolbar Save Project button persists the project to a real `.nodetree` file using the File System Access API (`showSaveFilePicker`), falling back to a download when the API is unavailable or the user cancels. A new Load Project button uses `showOpenFilePicker` (restricted to `.nodetree`/`.json`) with the existing hidden file-input as a fallback. The existing Import Project button accepts `.nodetree` and `.json` and reuses `parseImportedProject`. localStorage is still used for autosave/recovery only; the `.nodetree` file is the real project artifact. File format: JSON containing `{ name, version: 1, nodes, edges, settings, legend? }` (same shape as the localStorage schema), encoded with `serializeProject`. No new dependencies added.
- **Feature 4 — Print / PDF:** a new "Print / PDF" item in the Export dropdown calls `window.print()`. A print-only overlay in TreeCanvas renders a clean copy of the diagram (same nodes/edges/styling, no React Flow controls/minimap/grid/selection/highlight/context menus/toasts) using a second React Flow instance with `fitView`. A `@media print` stylesheet in `src/index.css` hides the entire editor shell (`.editor-shell`), React Flow chrome, selection outlines, highlight animations, and context menus, and reveals only the `.print-only` overlay. Print uses landscape `@page` with 0.4in margins, white background, and black text. The empty-state message is also shown in print when the canvas is empty. PNG/SVG/JSON export paths are untouched.

### In Progress

Nothing — Features 1–4 done and pushed. Remaining features from the task list (5–7) still pending:
5. Legend system (auto-detected color/category legend, position, editable labels, canvas/image/print)
6. Group/filter nodes by color/category (visual highlight + filter, no merge)
7. Polish and integration fixups

### Next Steps

1. Feature 5: legend component rendered as an overlay in TreeCanvas (respects `settings.showLegend` + `settings.legendPosition`); auto-detect categories/colors from nodes; editable label overrides stored in `project.legend.labels`; include legend in PNG/SVG/print snapshots.
2. Feature 6: color/category grouping panel — highlight group, filter to a group, "show all"; use `NodeData.category` + color; do not merge/reposition nodes.
3. After each feature: `npx tsc -b` (must be 0 errors), `npx vite build`, update CHANGELOG_AI.md, inspect `git diff`, commit with focused message, push to `origin/main`.

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
- `src/features/sidebar/LeftSidebar.tsx` — Feature 2: relationship picker (Child/Sibling/Parent/Unlinked) + `addRelativeToSelected()`; Standalone Node button unchanged; `ChevronsUp` added.
- `src/data/templates.ts` — `refine: use canonical handles for template-generated edges` (`ffc258e`): template edges built with `withCanonicalHandles()` so they follow the same bottom→top model as runtime connections.
- `src/lib/project.ts` — Feature 3: new `saveProject()` / `loadProject()` / `downloadProject()` / `encodeProject()` using the File System Access API with download/picker fallbacks; `.nodetree` MIME + extension; reuses `serializeProject` / `parseImportedProject`.
- `src/features/toolbar/Toolbar.tsx` — Feature 3: Save button now calls `saveProject()` (real file + localStorage autosave); renamed "Save to browser" → "Save Project"; added "Load Project" button (`showOpenFilePicker`); renamed "Import JSON" → "Import Project"; file input accept extended to `.nodetree`/`.json`. Feature 4: added `print()` function and "Print / PDF" menu item (Printer icon) in the Export dropdown.
- `src/features/canvas/TreeCanvas.tsx` — Feature 4: print-only overlay (a second React Flow instance with `fitView` rendering the same nodes/edges without chrome); `printNodes`/`printEdges` memos strip selection + search highlight; empty-state rendered in print too.
- `src/App.tsx` — Feature 4: root div given `editor-shell` class so the print stylesheet can hide the whole editor.
- `src/index.css` — Feature 4: `@media print` block (landscape `@page`, 0.4in margins, white bg, black text) that hides `.editor-shell`, React Flow chrome (`__controls`, `__minimap`, `__background`, `__handle`, `__panel`), context menus, toasts, selection outlines, highlight animations; reveals `.print-only`; `.print-diagram` fills the page with visible overflow; print-safe node/edge styling.
- Commit `53ae57b` — "feat: fix node connection direction (parent-bottom to child-top) with cycle-aware connect/reconnect"
- Commit `07d6c9d` — "feat: add relationship picker for Add Node (Child/Sibling/Parent/Unlinked) in left sidebar"
- Commit `ffc258e` — "refine: use canonical handles for template-generated edges"
- Commit `8364614` — "feat: add real .nodetree project save/load via File System Access API with download fallback"
- Commit `f4cfe74` — "feat: add print/PDF export with clean diagram-only print stylesheet"

### Git Checkpoint

- Branch `main`, clean working tree.
- Latest: `f4cfe74` — "feat: add print/PDF export with clean diagram-only print stylesheet"
- Before that: `8364614` — .nodetree save/load; `ffc258e` — canonical handles for templates; `07d6c9d` — relationship picker; `c130624` — Feature 1 docs update; `53ae57b` — connection direction fix; `d4cd2fc` — AI handoff checkpoint; `721f9be` — AGENTS.md + CHANGELOG_AI.md; `4de2f52` — context menu fix; `51ed50c` — full NodeTree editor; `cdb1cf8` — initial Vite template.

### Do Not Change

Without a strong, documented reason, do not modify: `useTreeEditor`'s return API and its persistence layer; `computeVisible()` dimension syncing; the `deleteKeyCode={null}` + global keyboard-delete design; `src/index.css` theme variables (light/dark emerald palette); the `Project` JSON schema; tsconfig strict flags; the one-parent-per-child invariant; the canonical bottom→top connection model now enforced by `edgeHandles.ts`; the relationship-picker pattern in `LeftSidebar.tsx` (Child/Sibling/Parent/Unlinked) without a clear reason; the localStorage autosave key (`nodetree:project:v1`) — it is recovery-only, with the real project file being `.nodetree`; the print-only overlay architecture in `TreeCanvas.tsx` (second React Flow instance + `@media print` hide/show) without a clear reason.
