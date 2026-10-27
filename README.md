# NodeTree (NodeForge)

An interactive, browser-based visual organizational chart and hierarchical tree editor built with **React Flow (@xyflow/react)**, **Tailwind CSS v4**, and **TypeScript**.

---

## Overview

NodeTree is designed for crafting organization charts, department hierarchies, family trees, and structured node diagrams directly in the browser. It features a fully-controlled infinite canvas with custom node shapes, branch folding, auto-layout, bulk editing, and native export options.

---

## Features

### Canvas & Node Editing
- **8 Node Shapes**: Rectangle, Rounded, Pill, Circle, Diamond, Hexagon, Card, and Group containers.
- **Custom Node Styling**: Colors, borders, typography, alignments, shadows, icons (Lucide catalog), and avatars.
- **Controlled Hierarchy**:
  - Add Child, Sibling, Parent, or Unlinked nodes directly from the sidebar.
  - Direction-enforced hierarchy edges (parent bottom to child top) with cycle detection.
  - Interactive re-linking and dragging of edge handles.
- **Branch Collapse**: Toggle collapse/expand on branches to manage complex hierarchies cleanly.
- **Multi-Select & Bulk Operations**: Align, distribute, recolor, and restyle multiple nodes simultaneously.

### Layout & Navigation
- **Automatic Layout**: Instant DAG layout powered by **Dagre** (Top-to-Bottom, Bottom-to-Top, Left-to-Right, Right-to-Left).
- **Search & Focus**: Live node search with auto-panning and highlight animations.
- **Minimap & Zoom Controls**: Smooth canvas navigation with custom controls and minimap preview.

### File Operations & Export
- **`.nodetree` Project Files**: Save and load native project files using the File System Access API (with browser download fallback).
- **Export Formats**:
  - **PNG / SVG**: High-resolution image capture of the viewport.
  - **Print / PDF**: Dedicated print stylesheet and clean export view.
  - **JSON**: Import and export normalized diagram data.
- **Auto-Persistence**: Real-time debounce auto-saving to `localStorage`.
- **Theming**: System, light, and dark modes powered by CSS variable tokens.

---

## Tech Stack

- **Framework**: React 19 + TypeScript (Strict mode)
- **Build Tool**: Vite 8
- **Canvas Engine**: `@xyflow/react` v12
- **Layout Engine**: `@dagrejs/dagre`
- **Styling**: Tailwind CSS v4 (CSS-first configuration) + CSS variables
- **Icons**: `lucide-react`
- **Image Generation**: `html-to-image`

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm, pnpm, or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Omiskn/NodeForge.git
cd NodeForge

# Install dependencies
npm install

# Start local development server
npm run dev
```

### Verification & Build

```bash
# Type-check
npx tsc -b

# Production build
npm run build

# Lint
npm run lint
```

---

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Delete` / `Backspace` | Delete selected nodes or edges |
| `Ctrl + Z` / `Cmd + Z` | Undo |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Redo |
| `Ctrl + C` / `Cmd + C` | Copy selected nodes |
| `Ctrl + V` / `Cmd + V` | Paste copied nodes |
| `Ctrl + D` / `Cmd + D` | Duplicate selection |
| `Ctrl + A` / `Cmd + A` | Select all nodes and edges |
| `Escape` | Clear selection / close menus |

---

## Project Structure

```
src/
├── App.tsx                     # Top-level shell, ReactFlowProvider, keyboard shortcuts
├── index.css                   # Tailwind v4 directives and theme variables
├── types/                      # TypeScript definitions (NodeData, Project, Settings, etc.)
├── hooks/
│   ├── useTreeEditor.ts        # Central editor state, undo/redo, persistence, actions
│   └── useHistory.ts           # Undo/redo snapshot history with coalescing
├── lib/
│   ├── layout.ts               # Dagre auto-layout logic
│   ├── edgeHandles.ts          # Canonical handles and cycle detection
│   ├── project.ts              # File save/load and serialization (.nodetree / JSON)
│   └── exportImage.ts          # PNG/SVG export using html-to-image
└── features/
    ├── canvas/                 # React Flow canvas, context menus, and print overlays
    ├── nodes/                  # Custom TreeNodeComponent and shape renderers
    ├── properties/             # Node/edge inspector and multi-select bulk editor
    ├── sidebar/                # Node template drawer, hierarchy actions, and tree presets
    └── toolbar/                # Top navigation, project actions, layout, and search
```

---

## License

MIT
