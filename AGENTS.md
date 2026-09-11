# AGENTS.md

Instructions for AI coding agents (Cline, Codex, OpenCode, Claude, etc.) working on this repository.

**Git is the source of truth for code and history.** This file holds durable project knowledge. For current progress, handoff status, and open work read `CHANGELOG_AI.md` (keep it updated — see AI Working Rules).

## Project Overview

**NodeTree** is a browser-based interactive organization-chart / node-tree visual editor. Users build hierarchical trees (org charts, department structures, family trees) on a React Flow canvas: draggable node templates (8 shapes), parent/child/sibling hierarchy actions, collapsible branches, visual groups, auto-layout, per-node styling, edge customization, search, multi-select bulk editing, undo/redo, ready-made templates, and JSON/PNG/SVG export. The project auto-saves to `localStorage` and supports light/dark/system themes.

## Technology Stack

- **React 19** + **TypeScript ~6.0** (strict flags, see tsconfig.app.json) + **Vite 8** (`@vitejs/plugin-react`)
- **@xyflow/react v12** — the canvas/node editor (fully controlled)
- **@dagrejs/dagre** — auto-layout engine (`src/lib/layout.ts`)
- **Tailwind CSS v4** via `@tailwindcss/vite` (CSS-first config, no tailwind.config file) + **CSS variables** for theming (`src/index.css`)
- **lucide-react** — all icons
- **html-to-image** — PNG/SVG export
- **clsx + tailwind-merge** — class merging (`cn()` in `src/lib/utils.ts`)
- No test framework, no state library, no UI component library, no router. Do not add these without strong need.

## Commands

```bash
npm run dev      # dev server
npm run build    # tsc -b && vite build  (type check + production build)
npm run lint     # eslint
npx tsc -b       # type check only (fastest verification)
```

Verification standard: `npx tsc -b` must pass with **0 errors** after changes.

## Project Architecture

Single-page app: `src/App.tsx` wraps the editor in `<ReactFlowProvider>` and renders `EditorShell`, which creates the central state via `useTreeEditor()` and passes the resulting `editor` object down as props.

```
src/
├── App.tsx                    # provider, layout (toolbar/sidebar/canvas/panel), keyboard shortcuts
├── index.css                  # Tailwind v4 import + ALL theme CSS variables (light/dark)
├── types/index.ts             # NodeData, NodeStyle, NodeShape, TreeNode, TreeEdge, Project, CanvasSettings…
├── hooks/
│   ├── useTreeEditor.ts       # CORE: all app state & operations (nodes, edges, history, clipboard,
│   │                          #   collapse, layout, search, theme, toasts, localStorage persistence)
│   └── useHistory.ts          # snapshot undo/redo with coalescing keys (600 ms window, cap 100)
├── data/
│   ├── templates.ts           # 7 templates + demo tree (declarative NodeSpec → buildTreeFromSpec)
│   ├── nodeStyles.ts          # default node style, shape presets, makeNodeData(), NodeDataInput
│   ├── edgeStyles.ts          # default edge style + edge type options
│   └── icons.ts               # lucide icon catalog for the node icon picker
├── lib/
│   ├── layout.ts              # dagre auto-layout (TB/BT/LR/RL)
│   ├── exportImage.ts         # PNG/SVG via html-to-image over the React Flow viewport
│   ├── project.ts             # serializeProject / parseImportedProject (JSON import normalization)
│   └── utils.ts               # cn(), uid(), clamp()
├── components/ui/             # hand-rolled shadcn-style primitives (no Radix): primitives (Button,
│                              #   Input, Select, Tooltip…), DropdownMenu, Dialog, ColorField, Toaster
└── features/
    ├── toolbar/Toolbar.tsx    # top bar: brand, rename, undo/zoom/layout, search, save/export/import, theme
    ├── sidebar/LeftSidebar.tsx# node templates (click or drag), parent/child/sibling, tree templates
    ├── canvas/TreeCanvas.tsx  # ReactFlow instance, DnD, context menus, edge styling, MiniMap/Controls
    ├── canvas/ContextMenu.tsx # right-click menus (node + pane); closes on action & outside press
    ├── nodes/TreeNodeComponent.tsx # custom node: 8 shapes, icon/avatar/title/subtitle, collapse btn
    └── properties/PropertiesPanel.tsx # node editor, edge editor, multi-select bulk edit/align/distribute
```

### Key mechanisms (read before touching)

- **Controlled React Flow**: canvas renders `editor.visibleDoc` (nodes/edges filtered by collapsed branches, with node dimensions synced from `data.style`). All mutations go through `useTreeEditor` and commit a history snapshot.
- **Undo/redo**: `useHistory` stores `{nodes, edges}` snapshots; `commit(nodes, edges, coalesceKey?)` merges rapid same-key changes (typing, dragging).
- **Collapse**: `data.collapsed` on a node hides all descendants via `computeVisible()`; the node component emits a window CustomEvent `nodetree:toggle-collapse` which `TreeCanvas` forwards to the editor.
- **Tree invariant**: every node has at most one parent (`onConnect` and `addRelative` enforce this).
- **Deletion**: React Flow's built-in delete is disabled (`deleteKeyCode={null}`); `App.tsx` handles Delete/Backspace globally so deletes are undoable. Shortcuts: Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y, Ctrl+C/V/D/A, Escape.
- **Persistence**: `localStorage` keys `nodetree:project:v1` (Project JSON, debounced 600 ms) and `nodetree:theme`. Theme = `dark` class on `<html>`.
- **Edge presentation** is mapped from `edge.data` (color/width/animated/arrow) to React Flow props in `TreeCanvas.styledEdge()`.

## Development Conventions

- Components are **function declarations**: `function Component() {}` — not arrow functions.
- Feature-based folders (`features/<area>/`); shared UI in `components/ui/`; pure logic in `lib/` and `hooks/`.
- TypeScript: strict, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` (use `import type`), `erasableSyntaxOnly` (no enums/namespaces). Avoid `any`.
- Styling: Tailwind utilities with theme variables like `bg-[var(--card)]`, `text-[var(--muted-foreground)]`; colors live ONLY in `src/index.css` (`:root` + `.dark`).
- State: all in `useTreeEditor` + local `useState` in panels. No external state management. No API layer — everything is client-side. No tests exist yet.
- Naming: components PascalCase files/functions (`Toolbar.tsx`), hooks `use*`, plain data modules camelCase (`nodeStyles.ts`).

## Important Decisions (already in the codebase)

- `@/*` path alias → `src/*` (vite.config.ts + tsconfig.app.json; no `baseUrl` — deprecated in TS 6).
- Node dimensions live in `data.style` and are mirrored onto `node.style` in `computeVisible` — React Flow needs explicit node width/height.
- Diamond/hexagon shapes use CSS `clip-path` (border layer + inset background layer); regular borders don't work on those shapes.
- Group nodes are visual containers (title + dashed border) — users drag members inside manually; no spatial containment logic.
- Demo tree on first launch = "University Organization" template (matches the original reference hierarchy).
- Context menus close after any action and on any outside `pointerdown`/`contextmenu` (capture phase), so right-clicking elsewhere first closes, then reopens at the new spot.

## Constraints (do not break)

- Do **not** recreate the Vite project, re-initialize tooling, or change Git configuration/history.
- Keep the `useTreeEditor` return API stable — Toolbar, Sidebar, TreeCanvas, and PropertiesPanel all consume it; check all call sites before changing signatures.
- Keep the `Project` JSON shape (`{ name, version: 1, nodes, edges, settings }`) backward-compatible (see `parseImportedProject`).
- Keep the one-parent-per-child invariant and the existing keyboard shortcuts.
- Don't introduce heavy dependencies (state managers, Radix, component kits, test runners) without explicit need.
- Preserve the emerald/green light+dark theme tokens in `index.css`; retheme by editing variables, not hardcoding colors.

## AI Working Rules

1. Inspect the existing implementation before modifying it; prefer editing existing code over creating duplicates.
2. Follow the conventions above; keep changes focused on the current task.
3. Do not add dependencies unless necessary, and record any addition in `CHANGELOG_AI.md`.
4. Preserve the existing architecture unless there is a strong reason to change it (then document it).
5. After significant changes run `npx tsc -b` (and `npm run build` / `npm run lint` when relevant) and fix all errors.
6. Inspect `git diff` before committing; commit only your own focused changes with clear imperative messages ("Fix …", "Add …", "docs: …").
7. Never overwrite or discard unrelated user changes; never stash/drop without asking.
8. Do not reset, rebase, force-push, or rewrite Git history unless explicitly requested.
9. Commit to `main` and push to `origin` — commits serve as recovery checkpoints.
10. Before ending a substantial task, update `CHANGELOG_AI.md` (status, completed, next steps, known issues, decisions, changed files, latest commit hash).

