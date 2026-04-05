# Canvas: Edge Delete & Node Duplicate

## Status
Approved for implementation.

## Feature 1: Double-click edge to delete

**Problem**: Edges (connection lines between nodes) cannot be selected or deleted interactively. Users must select nodes and rely on Delete key, but edges themselves are untouchable.

**Solution**: Add a double-click handler to `CanvasEdge` that deletes the edge immediately.

### Implementation

**`src/components/canvas/CanvasEdge.tsx`**:
- Add `onDeleteEdge` callback prop (or dispatch a custom event directly)
- Attach `onDoubleClick` to the `<path>` element
- Dispatch `canvas:deleteEdge` custom event with the edge ID

```tsx
const onDoubleClick = useCallback(() => {
  window.dispatchEvent(new CustomEvent('canvas:deleteEdge', { detail: id }));
}, [id]);

<path
  ...
  onDoubleClick={onDoubleClick}
/>
```

**`src/components/ZCanvas.tsx`**:
- Add `useEffect` listener for `canvas:deleteEdge` custom event
- On event, filter the edge out of state by ID
- Debounced save after deletion

```ts
const handleDeleteEdge = useCallback((e: Event) => {
  const id = (e as CustomEvent).detail;
  setEdges(eds => eds.filter(ed => ed.id !== id));
}, []);

useEffect(() => {
  const handler = (e: Event) => handleDeleteEdge(e);
  window.addEventListener('canvas:deleteEdge', handler);
  return () => window.removeEventListener('canvas:deleteEdge', handler);
}, [handleDeleteEdge]);
```

**Note**: The `<defs>` with `arrowclosed` marker is currently rendered inside every `CanvasEdge`. This is technically incorrect (markers should be defined once in a `<defs>` at the SVG root level) but is not part of this feature to fix.

---

## Feature 2: Alt+click node to duplicate

**Reference**: Figma behavior — Alt+click on an element duplicates it, offset by ~20px, and selects the duplicate.

**Solution**: In `CanvasNode`, add an `onClick` handler that checks `e.altKey`. If true, dispatch a `canvas:duplicateNode` custom event with the node's data and position offset.

### Implementation

**`src/components/canvas/CanvasNode.tsx`**:
- Add `onClick` handler to the outer `<div>`:
```ts
const onClick = useCallback((e: React.MouseEvent) => {
  if (e.altKey) {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('canvas:duplicateNode', {
      detail: {
        id,
        offset: { x: 20, y: 20 },
        data: { content: nodeData.content, color: nodeData.color, labels: nodeData.labels, subNodes: nodeData.subNodes },
      },
    }));
  }
}, [id, nodeData]);
```

**`src/components/ZCanvas.tsx`**:
- Add listener for `canvas:duplicateNode`:
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
}, []);
```

- The `isNew: true` flag causes the node to auto-focus (handled by existing `useEffect` in `CanvasNode`)
- Position offset is +20px/+20px so the duplicate is clearly visible from the original
- Child nodes and parent relationships are not copied (the duplicate is standalone)

---

## Help Modal Update

Add two entries to the Canvas help overlay in `ZCanvas.tsx`:

| Shortcut | Action |
|----------|--------|
| `Alt + Click node` | Duplicate this node |
| `Double-click edge` | Delete the connection |

---

## Files to Modify

1. `src/components/canvas/CanvasEdge.tsx` — add double-click handler
2. `src/components/canvas/CanvasNode.tsx` — add Alt+click duplicate handler
3. `src/components/ZCanvas.tsx` — add event listeners for `canvas:deleteEdge` and `canvas:duplicateNode`, update help modal
