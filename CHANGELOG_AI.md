# AI Progress Log

Handoff file for AI agents. Read `AGENTS.md` first for architecture, conventions, and rules. Update this file at the end of every substantial task.

## Current State

### Project Status

**Feature-complete v0.1.** NodeTree (React Flow org-chart editor) builds cleanly, TypeScript passes with 0 errors, `main` is pushed to `origin` and the working tree is clean. The app is ready for manual QA and polish work.

### Completed

- Full editor shell: top toolbar, left node sidebar, React Flow canvas (pan/zoom/drag/box-select), right properties panel; responsive drawers on small screens
- 8 node shapes (rectangle, rounded, pill, circle, diamond, hexagon, card, group) with live-styled rendering (icon, avatar, title/subtitle/description, colors, border, shadow, opacity, size, typography, alignment)
- Hierarchy ops: Add Parent/Child/Sibling (with parent rewiring), connect-by-handle (one-parent invariant), collapsible branches, group containers
- Auto-layout via dagre (TB/BT/LR/RL) + context menus (node & pane) that close on action and on outside press
- Undo/redo (snapshot history with coalescing), delete, copy/paste/duplicate (subtree links preserved), multi-select bulk edit + align/distribute
- Search (highlight + center), localStorage auto-save + manual save, 7 templates + demo tree, confirm dialogs, toasts, tooltips
- Import/Export: JSON (normalized), PNG/SVG (html-to-image); light/dark/system theme via CSS variables
- Keyboard shortcuts: Del/Backspace, Ctrl+Z/Shift+Z/Y, Ctrl+C/V/D/A, Escape

### In Progress

Nothing — no task is currently open. Handoff system (AGENTS.md + this file) just established.

### Next Steps

1. Run `npm run dev` and do a manual QA pass against the feature list in `AGENTS.md` (connect-by-handle, collapse, templates, export, theme switching).
2. Optionally rename `package.json` `"name"` from `vite-react-ts-template` to `nodetree` (cosmetic, was deliberately left untouched).
3. Optionally reduce the >500 kB bundle warning by lazy-loading `lucide-react`/`html-to-image` or enabling code splitting.
4. If the user asks for more features, implement incrementally and update this file + a focused commit per feature.

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
- localStorage schema: `nodetree:project:v1` = `{ name, version: 1, nodes, edges, settings }`; imports are normalized by `parseImportedProject`.
- Commit style: small focused commits, imperative messages, push to `origin/main`.

### Recently Changed Files

- `src/features/canvas/ContextMenu.tsx` — menu items now close the menu after acting; outside-close upgraded to `pointerdown` + `contextmenu` capture listeners; viewport clamping.
- `src/components/ui/DropdownMenu.tsx` — same outside-close hardening for toolbar dropdowns.
- (Earlier, commit 51ed50c) entire app: hooks, data, features, lib, types as described in `AGENTS.md`.

### Git Checkpoint

- Branch `main`, clean tree, synced with `origin/main`.
- Latest: `4de2f52` — "Fix context menu: close after choosing an action and on any outside click"
- Before that: `51ed50c` — full NodeTree editor build; `cdb1cf8` — initial Vite template commit.

### Do Not Change

Without a strong, documented reason, do not modify: `useTreeEditor`'s return API and its persistence layer; `computeVisible()` dimension syncing; the `deleteKeyCode={null}` + global keyboard-delete design; `src/index.css` theme variables; the `Project` JSON schema; tsconfig strict flags; the one-parent-per-child invariant.
