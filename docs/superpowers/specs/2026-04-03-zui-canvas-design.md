# ZUI Canvas — Design Specification

## Overview

A zoomable user interface (ZUI) canvas — similar to FigJam — for visual thinking and idea mapping. One infinite canvas that persists all nodes, connections, and viewport state to MongoDB. Users can create idea nodes, connect them with labeled edges, and return to exactly where they left off.

---

## Architecture

### Stack
- **React Flow** (`reactflow`) — pan/zoom/node-edge primitives
- **Next.js 16 App Router** — API routes + page component
- **MongoDB + Mongoose** — single document storage
- **Framer Motion** — toolbar animations, node transitions

### Data Flow
```
User Action → React Flow → Debounce (500ms) → PUT /api/canvas → MongoDB
Page Load → GET /api/canvas → React Flow → Render nodes/edges/viewport
```

### One Canvas Principle
Single MongoDB document (no collection of boards). The canvas IS the database document. This keeps it simple — one URL, one canvas, infinite space.

---

## Data Model

### `Canvas` Mongoose Model

```typescript
{
  _id: ObjectId,
  viewport: {
    x: Number,    // pan X offset
    y: Number,    // pan Y offset
    zoom: Number  // zoom level 0.1–2.0
  },
  nodes: [{
    id: String,           // UUID
    type: 'idea',         // extensible node type
    position: {
      x: Number,
      y: Number
    },
    data: {
      content: String,    // text content
      color: String,      // hex color tag (e.g. '#f97316')
      labels: [String]    // optional label array
    }
  }],
  edges: [{
    id: String,
    source: String,       // source node ID
    target: String,       // target node ID
    label: String,        // optional connection label
    animated: Boolean     // animated edge variant
  }],
  updatedAt: Date
}
```

---

## API Design

All routes live under `src/app/api/canvas/`.

### `GET /api/canvas`
- Returns the canvas document
- If none exists, creates a default empty canvas: `{ viewport: {x:0,y:0,zoom:1}, nodes: [], edges: [] }`
- Response: `{ success: true, data: CanvasDocument }`

### `PUT /api/canvas`
- Full canvas save — replaces nodes, edges, viewport in one write
- Request body: `{ viewport, nodes, edges }`
- Response: `{ success: true }`
- Called on every change, debounced 500ms client-side

### `POST /api/canvas/nodes`
- Create a single node
- Request body: `{ position: {x,y}, content?: string }`
- Returns: `{ success: true, data: newNode }`

### `DELETE /api/canvas/nodes/[id]`
- Remove a node by ID
- Also removes all edges connected to that node
- Response: `{ success: true }`

---

## Visual Design

### Canvas Background
- Subtle dot grid: `radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)`
- Background size: 24px × 24px

### Node Style
- White card (`#ffffff`) on light canvas, slate-800 (`#1e293b`) on dark
- `box-shadow: 0 2px 8px rgba(0,0,0,0.08)` (light) / `0 2px 8px rgba(0,0,0,0.4)` (dark)
- Border radius: 12px
- Padding: 16px
- Min width: 160px, max width: 320px
- Color tag: 6px left border in user's chosen color
- Selected: `box-shadow: 0 0 0 2px #3b82f6` (blue ring)
- Font: system-ui stack

### Edge Style
- Bezier curve, stroke `#94a3b8`, width 2px
- Arrow head at target end
- Optional label: small pill at midpoint, background `#f1f5f9`, text `#475569`
- Hover: stroke `#64748b`
- Animated variant: dashed stroke with CSS animation

### Toolbar
- Floating, bottom-center, 48px from bottom
- Glass morphism: `background: rgba(255,255,255,0.9)`, `backdrop-filter: blur(12px)`
- Border: `1px solid rgba(0,0,0,0.08)`, border-radius: 9999px (pill)
- Buttons: Add Node (+), Fit View, Dark Mode toggle
- Auto-hides after 3s idle, reappears on mouse move

### Dark Mode
| Element | Light | Dark |
|---------|-------|------|
| Canvas background | `#ffffff` | `#0f172a` |
| Grid dots | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.05)` |
| Node card | `#ffffff` | `#1e293b` |
| Node text | `#0f172a` | `#f1f5f9` |
| Edge stroke | `#94a3b8` | `#475569` |
| Toolbar | `rgba(255,255,255,0.9)` | `rgba(30,41,59,0.9)` |

---

## Interactions

### Canvas Navigation
| Action | Trigger |
|--------|---------|
| Pan | Drag empty canvas, or middle mouse drag |
| Zoom | Scroll wheel, or pinch |
| Fit view | Double-click empty canvas, toolbar button, or `F` |
| Select node | Single click |
| Multi-select | Shift+click, or drag rectangle |
| Delete | `Delete` or `Backspace` on selected |

### Node Interactions
| Action | Trigger |
|--------|---------|
| Move | Drag |
| Edit | Double-click → inline contenteditable |
| Change color | Right-click → context menu with 8 color swatches |
| Connect | Drag from node handle dot to another node |
| Delete | Select + Delete, or right-click → Delete |

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Ctrl+K` | Command palette |
| `F` | Fit all nodes in view |
| `Delete` / `Backspace` | Delete selected |
| `Escape` | Deselect all |

### Creation Methods
1. **Double-click canvas** → inline text input appears at cursor, Enter to create node
2. **Toolbar Add Node** → node created at viewport center
3. **Command palette** (`Ctrl+K`) → type to search/create, Enter to place at center

### Auto-save
- Debounced 500ms after any change
- Toast indicator bottom-right: "Saving..." → "Saved" (disappears after 2s)
- Saves viewport so exact view is restored on reload

---

## Color Palette for Nodes

8 preset colors users can assign to nodes:

| Name | Hex | Use case |
|------|-----|----------|
| Orange | `#f97316` | Ideas, sparks |
| Blue | `#3b82f6` | Tasks, action items |
| Green | `#22c55e` | Success, completed |
| Purple | `#a855f7` | Creative, exploration |
| Red | `#ef4444` | Urgent, important |
| Yellow | `#eab308` | Caution, in progress |
| Teal | `#14b8a6` | Learning, research |
| Gray | `#64748b` | Notes, reference |

---

## File Structure

```
src/
├── components/
│   ├── ZCanvas.tsx                    # Main React Flow wrapper
│   └── canvas/
│       ├── CanvasNode.tsx             # Custom node component
│       ├── CanvasEdge.tsx             # Custom edge component
│       ├── CanvasToolbar.tsx          # Floating toolbar
│       └── CommandPalette.tsx         # Ctrl+K palette
├── models/
│   └── Canvas.ts                      # Mongoose model
├── app/
│   └── api/
│       └── canvas/
│           ├── route.ts               # GET, PUT
│           └── nodes/
│               └── [id]/
│                   └── route.ts       # DELETE node
└── lib/
    └── db.ts                          # MongoDB connection (reused)
```

---

## Implementation Order

1. **Model + API** — `Canvas` model, CRUD routes, verify DB read/write
2. **Basic Canvas** — React Flow integration, viewport save/restore, node rendering
3. **Node Editing** — inline edit, color tags, right-click context menu
4. **Connections** — custom edges with arrows and labels
5. **Toolbar + Creation** — floating toolbar, double-click create, add node at center
6. **Dark Mode** — theme toggle, all dark style variants
7. **Command Palette** — Ctrl+K search and create
8. **Polish** — auto-hide toolbar, save toast, keyboard shortcuts, fit view

---

## Scope Boundaries

**In scope (Balanced set):**
- One infinite canvas
- Text nodes with color tags
- Bezier edges with arrows and optional labels
- Multiple creation methods (double-click, toolbar, palette)
- Pan, zoom, fit view
- Dark mode
- Auto-save with viewport persistence
- Right-click node color menu

**Out of scope:**
- Multiple named boards
- Images in nodes
- Embedded links
- Undo/redo
- Theme switcher (all aesthetics at once)
- Keyboard shortcut system beyond basic
