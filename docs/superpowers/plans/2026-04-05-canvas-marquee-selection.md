# Canvas Marquee Selection — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add click-drag marquee selection to the canvas so users can draw a rectangle to select multiple nodes and edges, then Delete to remove them.

**Architecture:** All changes are in `ZCanvas.tsx`. State tracks `selectionStart`, `selectionRect`, and `isSelecting`. Mouse events on the ReactFlow pane detect drag intent. Hit detection converts flow coordinates to screen space and checks whether node centers and edge midpoints fall inside the selection rectangle. Existing Delete key handler already handles deletion.

**Tech Stack:** React Flow (`@xyflow/react`), React callbacks, CustomEvents

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/components/ZCanvas.tsx` | All changes: state, mouse handlers, hit detection, selection rect rendering, help modal update |

---

## Task 1: Add marquee state and mouse tracking

**Files:** `src/components/ZCanvas.tsx` — add state variables and pane mouse handlers

### Step 1: Add state variables

Find where other `useState` calls are in `CanvasInner` (around line 23). Add three new state variables after the existing ones:

```ts
const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
const [isSelecting, setIsSelecting] = useState(false);
```

### Step 2: Add `onPaneMouseDown` handler

Add this after the `onPaneDoubleClick` definition (around line 182). This handler detects when the user starts a drag on the pane (not on a node):

```ts
const onPaneMouseDown = useCallback((e: React.MouseEvent) => {
  // Only start marquee if clicking directly on the pane background
  // e.target should be the react-flow__pane element
  const target = e.target as HTMLElement;
  if (!target.classList.contains('react-flow__pane') && !target.classList.contains('react-flow__background')) return;

  // Don't start if clicking with modifier keys (allow browser gestures)
  if (e.altKey || e.ctrlKey || e.metaKey) return;

  setIsSelecting(true);
  setSelectionStart({ x: e.clientX, y: e.clientY });
  setSelectionRect({ x: e.clientX, y: e.clientY, width: 0, height: 0 });
}, []);
```

### Step 3: Add `onPaneMouseMove` handler

Add after `onPaneMouseDown`:

```ts
const onPaneMouseMove = useCallback((e: React.MouseEvent) => {
  if (!isSelecting || !selectionStart) return;

  const dx = e.clientX - selectionStart.x;
  const dy = e.clientY - selectionStart.y;

  setSelectionRect({
    x: dx >= 0 ? selectionStart.x : e.clientX,
    y: dy >= 0 ? selectionStart.y : e.clientY,
    width: Math.abs(dx),
    height: Math.abs(dy),
  });
}, [isSelecting, selectionStart]);
```

### Step 4: Add `onPaneMouseUp` handler

Add after `onPaneMouseMove`. This handler applies the selection on mouseup:

```ts
const onPaneMouseUp = useCallback((e: React.MouseEvent) => {
  if (!isSelecting || !selectionRect) {
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionRect(null);
    return;
  }

  // Only apply if the rect has meaningful size (not just a click)
  if (selectionRect.width > 5 || selectionRect.height > 5) {
    const { x, y, width, height } = selectionRect;

    // Get current viewport for coordinate conversion
    const viewport = getViewport();

    // Helper: convert flow position to screen position
    const toScreen = (fx: number, fy: number) => ({
      x: fx * viewport.zoom + viewport.x,
      y: fy * viewport.zoom + viewport.y,
    });

    // Select nodes whose center falls inside the rect
    setNodes(nds => nds.map(n => {
      const center = toScreen(n.position.x + (n.width || 160) / 2, n.position.y + (n.height || 80) / 2);
      const inside = center.x >= x && center.x <= x + width && center.y >= y && center.y <= y + height;
      return inside ? { ...n, selected: true } : n;
    }));

    // Select edges whose midpoint falls inside the rect
    setEdges(eds => eds.map(ed => {
      const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } = ed;
      // Approximate bezier midpoint in screen space
      // React Flow bezier control points: cp1 = source + horizontal offset, cp2 = target - horizontal offset
      const hDist = Math.abs(targetX - sourceX) * 0.5;
      const cp1x = sourceX + (sourcePosition === 'left' ? -hDist : sourcePosition === 'right' ? hDist : 0);
      const cp1y = sourceY + (sourcePosition === 'top' || sourcePosition === 'bottom' ? 0 : 0);
      const cp2x = targetX + (targetPosition === 'left' ? -hDist : targetPosition === 'right' ? hDist : 0);
      const cp2y = targetY + (targetPosition === 'top' || targetPosition === 'bottom' ? 0 : 0);
      const screenSource = toScreen(sourceX, sourceY);
      const screenTarget = toScreen(targetX, targetY);
      const screenCp1 = toScreen(cp1x, cp1y);
      const screenCp2 = toScreen(cp2x, cp2y);
      const midX = 0.125 * screenSource.x + 0.375 * screenCp1.x + 0.375 * screenCp2.x + 0.125 * screenTarget.x;
      const midY = 0.125 * screenSource.y + 0.375 * screenCp1.y + 0.375 * screenCp2.y + 0.125 * screenTarget.y;
      const inside = midX >= x && midX <= x + width && midY >= y && midY <= y + height;
      return inside ? { ...ed, selected: true } : ed;
    }));
  }

  setIsSelecting(false);
  setSelectionStart(null);
  setSelectionRect(null);
}, [isSelecting, selectionRect, getViewport]);
```

### Step 5: Wire up handlers to ReactFlow pane

Find the `<ReactFlow>` element (around line 343). Add `onMouseDown={onPaneMouseDown}`, `onMouseMove={onPaneMouseMove}`, and `onMouseUp={onPaneMouseUp}` to the `<ReactFlow>` element:

```tsx
<ReactFlow
  nodes={nodesWithCallbacks}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
  onMoveEnd={onMoveEnd}
  onDoubleClick={onPaneDoubleClick}
  onDrop={onDrop}
  onDragOver={onDragOver}
  onNodeDragStart={onNodeDragStart}
  onMouseDown={onPaneMouseDown}
  onMouseMove={onPaneMouseMove}
  onMouseUp={onPaneMouseUp}
  ...
```

### Step 6: Commit

```bash
git add src/components/ZCanvas.tsx
git commit -m "feat(canvas): add marquee selection state and mouse tracking

Adds selectionStart, selectionRect, isSelecting state.
onPaneMouseDown/Move/Up handlers track drag on the pane.
Viewport-aware hit detection on mouseup selects nodes and edges."
```

---

## Task 2: Render selection rectangle overlay

**Files:** `src/components/ZCanvas.tsx` — add the visual overlay div

### Step 1: Add selection rectangle rendering

Find the `{saveStatus !== 'idle' && ...}` block (around line 332) and add the selection rectangle div AFTER it, before the `<CanvasToolbar>`:

```tsx
{saveStatus !== 'idle' && (
  <div className="fixed bottom-4 right-4 text-xs px-3 py-1.5 rounded-full shadow" style={{ background: 'var(--surface)', color: 'var(--gray-500)', border: '1px solid var(--border)' }}>
    {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
  </div>
)}
{selectionRect && (
  <div
    style={{
      position: 'fixed',
      left: selectionRect.x,
      top: selectionRect.y,
      width: selectionRect.width,
      height: selectionRect.height,
      background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
      border: '1.5px dashed var(--primary)',
      pointerEvents: 'none',
      zIndex: 9999,
      borderRadius: 0,
    }}
  />
)}
<CanvasToolbar saveStatus={saveStatus} />
```

### Step 2: Commit

```bash
git add src/components/ZCanvas.tsx
git commit -m "feat(canvas): render marquee selection rectangle overlay

Selection rect drawn as semi-transparent dashed border div,
positioned fixed over the canvas with pointer-events: none."
```

---

## Task 3: Update help modal with marquee shortcut

**Files:** `src/components/ZCanvas.tsx` — add help text for marquee

### Step 1: Add help modal entry

Find the help modal shortcuts section. Add a new entry for the marquee drag. Place it after the "Drag node" entry (which describes stacking) and before the "Node interactions" divider. The entry goes right before `<div className="pt-4 mt-4" style={{ borderTop: '1px solid var(--border)' }}>`:

```tsx
<div className="flex gap-3 items-start">
  <span className="px-2 py-1 rounded text-xs font-mono min-w-[60px] text-center" style={{ background: 'var(--gray-800)', color: '#f97316' }}>Click + Drag</span>
  <span>Draw rectangle to select multiple nodes and edges</span>
</div>
```

### Step 2: Commit

```bash
git add src/components/ZCanvas.tsx
git commit -m "docs(canvas): add marquee selection to help modal

Adds Click + Drag shortcut showing marquee selection behavior."
```

---

## Verification

After all tasks:

1. Open the canvas
2. Create several nodes and connect them with edges
3. Click and drag on the empty pane — a dashed selection rectangle should appear
4. Release — nodes and edges inside the rect should be selected (highlighted)
5. Press Delete — all selected items should be removed
6. Double-click an edge — it should still delete immediately
7. Open help — "Click + Drag" entry should appear
