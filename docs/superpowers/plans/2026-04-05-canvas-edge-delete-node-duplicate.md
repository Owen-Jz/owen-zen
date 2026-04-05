# Canvas: Edge Delete & Node Duplicate — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to double-click an edge to delete it, and Alt+click a node to duplicate it (Figma-style).

**Architecture:** Both features use the existing custom event bus pattern already established in ZCanvas.tsx. Edge delete dispatches `canvas:deleteEdge`; node duplicate dispatches `canvas:duplicateNode`. ZCanvas listens and updates state, then triggers the existing debounced save.

**Tech Stack:** React Flow (`@xyflow/react`), React callbacks, CustomEvents

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/components/canvas/CanvasEdge.tsx` | Renders edge path + arrowhead; add double-click handler |
| `src/components/canvas/CanvasNode.tsx` | Renders node card; add Alt+click duplicate handler |
| `src/components/ZCanvas.tsx` | Canvas state management; add two event listeners + update help modal |

---

## Task 1: CanvasEdge — add double-click to delete

**Files:** `src/components/canvas/CanvasEdge.tsx`

- [ ] **Step 1: Add `onDoubleClick` callback and wire it to the path element**

Read the file and locate the `<path` element (line 28-37). Add `import { memo, useCallback } from 'react'` (memo is already imported, just add useCallback). Add the `onDoubleClick` handler before the `return (` and attach it to the `<path>`.

```tsx
import { memo, useCallback } from 'react';
// ... existing imports

export function CanvasEdge ({
  id,
  // ... existing props
}: EdgeProps) {
  // ... existing code up to before return(

  const onDoubleClick = useCallback(() => {
    window.dispatchEvent(new CustomEvent('canvas:deleteEdge', { detail: id }));
  }, [id]);

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        stroke={selected ? 'var(--gray-500)' : 'var(--gray-600)'}
        strokeWidth={2}
        strokeDasharray={animated ? '5 5' : undefined}
        fill="none"
        markerEnd="url(#arrowclosed)"
        style={animated ? { animation: 'dash 0.5s linear infinite' } : undefined}
        onDoubleClick={onDoubleClick}
      />
```

- [ ] **Step 2: Verify no import changes needed**

`memo` is already imported from 'react', `useCallback` just needs to be added to that import line. All other imports (`getBezierPath`, `EdgeProps`, `EdgeLabelRenderer`) are already present and unchanged.

- [ ] **Step 3: Commit**

```bash
git add src/components/canvas/CanvasEdge.tsx
git commit -m "feat(canvas): add double-click to delete edge

Dispatches canvas:deleteEdge custom event on path double-click."

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## Task 2: CanvasNode — add Alt+click to duplicate

**Files:** `src/components/canvas/CanvasNode.tsx`

- [ ] **Step 1: Add `onClick` handler with Alt key check**

Locate the outer `<div>` at line 92. The `data` prop is typed as `NodeProps['data']` which is `unknown` — the component already casts it to `CanvasNodeData` at line 36. Add `useCallback` to the import (already has `useState, useCallback, useEffect`). Insert the `onClick` handler before the `return (`, then add `onClick={onClick}` to the outer `<div>`.

```tsx
// In the import from 'react', add useCallback (it already has useState, useCallback, useEffect)

const onClick = useCallback((e: React.MouseEvent) => {
  if (e.altKey) {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('canvas:duplicateNode', {
      detail: {
        id,
        offset: { x: 20, y: 20 },
        data: {
          content: nodeData.content,
          color: nodeData.color,
          labels: nodeData.labels,
          subNodes: nodeData.subNodes,
        },
      },
    }));
  }
}, [id, nodeData.content, nodeData.color, nodeData.labels, nodeData.subNodes]);
```

Then on the outer `<div>`, add `onClick={onClick}` alongside the existing handlers. The div currently has: `onDragStart`, `onDragEnd`, `onDragOver`, `onDragLeave`, `onDrop`, `onDoubleClick`, `onContextMenu`. Add `onClick` to that list.

- [ ] **Step 2: Verify dependency array**

The dependency array for `onClick` uses `nodeData.content`, `nodeData.color`, `nodeData.labels`, `nodeData.subNodes` (not the whole `nodeData` object) to avoid unnecessary re-creation. The `id` is stable.

- [ ] **Step 3: Commit**

```bash
git add src/components/canvas/CanvasNode.tsx
git commit -m "feat(canvas): add Alt+click to duplicate node

Dispatches canvas:duplicateNode with offset +20/+20 and copies
content, color, labels, and subNodes. isNew flag triggers auto-focus."

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## Task 3: ZCanvas — add event listeners and update help modal

**Files:** `src/components/ZCanvas.tsx`

- [ ] **Step 1: Add `handleDeleteEdge` callback**

Find the existing `handleDeleteNode` listener section (around line 211-219). Add `handleDeleteEdge` nearby, after the existing delete listener. It should be placed alongside the other `useEffect` listeners.

```ts
// Add after the canvas:deleteNode listener (around line 219)
const handleDeleteEdge = useCallback((e: Event) => {
  const id = (e as CustomEvent).detail;
  setEdges(eds => eds.filter(ed => ed.id !== id));
}, []);
```

- [ ] **Step 2: Add useEffect for `canvas:deleteEdge`**

Add the listener useEffect right after the `canvas:deleteNode` listener (line 211-219). The pattern is identical to the existing listeners.

```ts
useEffect(() => {
  const handler = (e: Event) => handleDeleteEdge(e);
  window.addEventListener('canvas:deleteEdge', handler);
  return () => window.removeEventListener('canvas:deleteEdge', handler);
}, [handleDeleteEdge]);
```

- [ ] **Step 3: Add `handleDuplicateNode` callback**

Add this after `handleDeleteEdge`. It finds the source node by ID, clones it at an offset position, and resets child/parent relationships so the duplicate is standalone.

```ts
const handleDuplicateNode = useCallback((e: Event) => {
  const { id, offset, data } = (e as CustomEvent).detail;
  setNodes(nds => {
    const sourceNode = nds.find(n => n.id === id);
    if (!sourceNode) return nds;
    const newNode: Node = {
      id: crypto.randomUUID(),
      type: 'idea',
      position: {
        x: sourceNode.position.x + offset.x,
        y: sourceNode.position.y + offset.y,
      },
      data: {
        ...data,
        isNew: true,
        subNodes: data.subNodes ? [...data.subNodes] : [],
        labels: [...(data.labels || [])],
        childIds: [],
        parentId: undefined,
      },
    };
    return [...nds, newNode];
  });
  debouncedSave(getViewport(), nodes, edges);
}, [getViewport, debouncedSave, nodes, edges]);
```

- [ ] **Step 4: Add useEffect for `canvas:duplicateNode`**

Add the listener after the `canvas:deleteEdge` listener.

```ts
useEffect(() => {
  const handler = (e: Event) => handleDuplicateNode(e);
  window.addEventListener('canvas:duplicateNode', handler);
  return () => window.removeEventListener('canvas:duplicateNode', handler);
}, [handleDuplicateNode]);
```

**Important:** The `debouncedSave` call inside `handleDuplicateNode` needs `nodes` and `edges` in its dependency array — but since this is a state update callback and the save is debounced, reading stale state is acceptable here (the debounce will fire with the latest state). The `nodes` and `edges` deps are fine as-is.

- [ ] **Step 5: Update the help modal**

Locate the help modal (around line 366-428). Find the shortcuts table and add two new rows before the closing `</div>` of the shortcuts list — specifically, add them before the "Node interactions" section divider (before the `<div className="pt-4 mt-4" style={{ borderTop: '1px solid var(--border)' }}>`).

```tsx
<div className="flex gap-3 items-start">
  <span className="px-2 py-1 rounded text-xs font-mono min-w-[60px] text-center" style={{ background: 'var(--gray-800)', color: '#f97316' }}>Alt + Click</span>
  <span>Duplicate this node</span>
</div>
<div className="flex gap-3 items-start">
  <span className="px-2 py-1 rounded text-xs font-mono min-w-[60px] text-center" style={{ background: 'var(--gray-800)', color: '#f97316' }}>Dbl Click edge</span>
  <span>Delete the connection</span>
</div>
```

Insert these two entries right before the "Node interactions" section divider.

- [ ] **Step 6: Commit**

```bash
git add src/components/ZCanvas.tsx
git commit -m "feat(canvas): add edge delete and node duplicate event listeners

- Listen for canvas:deleteEdge to remove edges on double-click
- Listen for canvas:duplicateNode to clone nodes with offset +20/+20
- Update help modal with new shortcuts"

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## Verification

After completing all tasks:

1. Open the canvas (`/canvas` or the canvas view)
2. Create two nodes and connect them with an edge
3. Double-click the edge — it should disappear
4. Create a node, hold Alt and click it — a duplicate should appear offset by 20px/20px and auto-focus
5. Check the help modal (press `?` or the help button) to confirm the new shortcuts are listed
