# Canvas Marquee Selection

## Status
Approved for implementation.

## Overview

Click and drag on the canvas pane to draw a selection rectangle (marquee). Any nodes whose center falls inside, and any edges whose midpoint falls inside, become selected. Press Delete to remove them. Double-click edge to delete directly remains unchanged.

---

## Visual Design

### Selection Rectangle

- Semi-transparent fill: `color-mix(in srgb, var(--primary) 15%, transparent)`
- Dashed border: `1.5px dashed var(--primary)`
- No border-radius (sharp rectangle)
- `pointer-events: none` so it doesn't interfere with the canvas
- `z-index: 9999` to render on top of everything
- Positioned with `position: fixed` using pixel coordinates matching the normalized drag rectangle

---

## Interaction Design

### Trigger

- **Mousedown on the pane** (`e.target` is the ReactFlow pane div, not a node or edge) initiates marquee mode.
- **Mousedown on a node or edge** is handled by existing React Flow drag/selection behavior — no marquee starts.
- Distinguish by checking `e.target` class name or `closest('[data-handle]')` approach.

### Tracking

- Record `selectionStart: { x, y }` in screen coordinates on mousedown.
- On `mousemove`, compute `selectionRect: { x, y, width, height }` normalized so width/height are always positive (handle all 4 drag directions).
- On `mouseup`, apply selection and clear `selectionRect`.

### Selection Rectangle Rendering

```tsx
{selectionRect && (
  <div
    style={{
      position: 'fixed',
      left: Math.min(selectionStart.x, selectionStart.x + dx),
      top: Math.min(selectionStart.y, selectionStart.y + dy),
      width: Math.abs(dx),
      height: Math.abs(dy),
      background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
      border: '1.5px dashed var(--primary)',
      pointerEvents: 'none',
      zIndex: 9999,
    }}
  />
)}
```

---

## Hit Detection

### Nodes

A node is selected if its center (in screen coordinates) falls inside the selection rectangle.

```ts
const nodeCenterScreen = {
  x: screenX(node.position.x),
  y: screenY(node.position.y),
};
const inRect = (
  nodeCenterScreen.x >= rect.x &&
  nodeCenterScreen.x <= rect.x + rect.width &&
  nodeCenterScreen.y >= rect.y &&
  nodeCenterScreen.y <= rect.y + rect.height
);
```

Use `useReactFlow().screenToFlowPosition` or the inverse of the viewport transform. React Flow provides `useReactFlow()` which can convert screen → flow coordinates. For screen → flow conversion:

```ts
const { screenToFlowPosition } = useReactFlow();
const flowPos = screenToFlowPosition({ x: screenX, y: screenY });
```

Node screen position must account for the current viewport (pan + zoom). Since the selection rect is in screen space, convert node flow positions to screen space:

```ts
// Node in screen coordinates
const nodeScreenX = node.position.x * viewport.zoom + viewport.x;
const nodeScreenY = node.position.y * viewport.zoom + viewport.y;
```

### Edges

Calculate the bezier midpoint using the same `getBezierPath` that `CanvasEdge` uses. For a cubic bezier with control points P0, P1, P2, P3, the midpoint at t=0.5 is:

```
M = 0.125·P0 + 0.375·P1 + 0.375·P2 + 0.125·P3
```

P0 = source handle position, P3 = target handle position. P1 and P2 are calculated by React Flow internally. Use `getBezierPath` to get the path string, then sample the midpoint from it — or pass the source/target positions to calculate directly.

Simpler approach: call `getBezierPath` and use a regex or path parser to extract the bezier curve points, then compute the midpoint.

Easiest approach: since we know sourceX, sourceY, targetX, targetY (from edge data), and sourcePosition/targetPosition, we can calculate the bezier midpoint directly:

```ts
// For cubic bezier with symmetric control points (React Flow default):
const cp1x = sourceX + (targetX - sourceX) * 0.5;
const cp1y = sourceY;
const cp2x = targetX - (targetX - sourceX) * 0.5;
const cp2y = targetY;
const midX = 0.125 * sourceX + 0.375 * cp1x + 0.375 * cp2x + 0.125 * targetX;
const midY = 0.125 * sourceY + 0.375 * cp1y + 0.375 * cp2y + 0.125 * targetY;
```

Check if this midpoint falls within the screen-space selection rectangle.

### Selection Application

```ts
setNodes(nds => nds.map(n =>
  isNodeSelected(n) ? { ...n, selected: true } : n
));
setEdges(eds => eds.map(ed =>
  isEdgeSelected(ed) ? { ...ed, selected: true } : ed
));
```

The existing `Delete` key handler (lines 92-109 in `ZCanvas.tsx`) already deletes all selected nodes and any edges connected to them, or selected edges alone.

---

## Interaction States

| Action | Result |
|--------|--------|
| Click+drag on pane | Draws selection rect, selects nodes/edges on release |
| Click+drag on node | Existing React Flow node drag (no marquee) |
| Double-click edge | Direct delete (existing, unchanged) |
| Delete/Backspace | Deletes all selected (nodes+edges or edges-only) |
| Escape | Deselects all (existing, unchanged) |

---

## Files to Modify

1. `src/components/ZCanvas.tsx` — Add marquee state, mouse event handlers, selection rectangle rendering, hit detection functions.
2. `src/components/canvas/CanvasEdge.tsx` — (no changes needed; edge midpoint calculated from available props)

---

## Out of Scope

- Multi-select via Shift+click (existing React Flow behavior)
- Dragging selected nodes together as a group
- Marquee visual resize handles
- Touch support
