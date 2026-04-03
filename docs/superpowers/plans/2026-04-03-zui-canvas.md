# ZUI Canvas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a zoomable user interface canvas — one infinite React Flow canvas that persists nodes, edges, and viewport state to MongoDB.

**Architecture:** Single MongoDB document stores the entire canvas state. React Flow handles pan/zoom/node-edge rendering. Auto-save with 500ms debounce. Framer Motion for toolbar animations.

**Tech Stack:** `reactflow`, `@xyflow/react` (React Flow v12), Framer Motion, Mongoose, Next.js App Router.

---

## File Map

| File | Purpose |
|------|---------|
| `src/models/Canvas.ts` | Mongoose schema for canvas document |
| `src/app/api/canvas/route.ts` | GET (fetch/create) + PUT (full save) |
| `src/app/api/canvas/nodes/route.ts` | POST — create single node |
| `src/app/api/canvas/nodes/[id]/route.ts` | DELETE — remove node + connected edges |
| `src/components/ZCanvas.tsx` | Main React Flow wrapper, viewport state, auto-save |
| `src/components/canvas/CanvasNode.tsx` | Custom idea node with color tag + inline edit |
| `src/components/canvas/CanvasEdge.tsx` | Custom bezier edge with arrow + label pill |
| `src/components/canvas/CanvasToolbar.tsx` | Floating glass toolbar |
| `src/components/canvas/CommandPalette.tsx` | Ctrl+K quick create/search |
| `src/__tests__/api/canvas.test.ts` | API route tests |
| `src/__tests__/components/ZCanvas.test.tsx` | Component tests |

---

## Task 1: Install React Flow

**Files:**
- `package.json` — dependency addition

- [ ] **Step 1: Install reactflow package**

Run: `npm install reactflow @xyflow/react`
Expected: Package added to package.json dependencies

---

## Task 2: Canvas Mongoose Model

**Files:**
- Create: `src/models/Canvas.ts`
- Test: `src/__tests__/api/canvas.test.ts` (partial, extended in Task 3)

- [ ] **Step 1: Create the Canvas model**

```typescript
// src/models/Canvas.ts
import mongoose from 'mongoose';

const CanvasNodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, default: 'idea' },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  data: {
    content: { type: String, default: '' },
    color: { type: String, default: '#f97316' },
    labels: [{ type: String }],
  },
}, { _id: false });

const CanvasEdgeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  label: { type: String, default: '' },
  animated: { type: Boolean, default: false },
}, { _id: false });

const CanvasSchema = new mongoose.Schema({
  viewport: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    zoom: { type: Number, default: 1 },
  },
  nodes: [CanvasNodeSchema],
  edges: [CanvasEdgeSchema],
}, { timestamps: true });

export default mongoose.models.Canvas || mongoose.model('Canvas', CanvasSchema);
```

- [ ] **Step 2: Commit**

```bash
git add src/models/Canvas.ts
git commit -m "feat: add Canvas mongoose model"
```

---

## Task 3: Canvas API Routes

**Files:**
- Create: `src/app/api/canvas/route.ts`
- Create: `src/app/api/canvas/nodes/route.ts`
- Create: `src/app/api/canvas/nodes/[id]/route.ts`
- Create: `src/__tests__/api/canvas.test.ts`

- [ ] **Step 1: Create GET + PUT route**

```typescript
// src/app/api/canvas/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Canvas from '@/models/Canvas';

export async function GET() {
  await dbConnect();
  try {
    let canvas = await Canvas.findOne({});
    if (!canvas) {
      canvas = await Canvas.create({
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: [],
        edges: [],
      });
    }
    return NextResponse.json({ success: true, data: canvas });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch canvas' }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  await dbConnect();
  try {
    const { viewport, nodes, edges } = await req.json();
    const canvas = await Canvas.findOneAndUpdate(
      {},
      { viewport, nodes, edges },
      { new: true, upsert: true, runValidators: true }
    );
    return NextResponse.json({ success: true, data: canvas });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to save canvas' }, { status: 400 });
  }
}
```

- [ ] **Step 2: Create POST nodes route**

```typescript
// src/app/api/canvas/nodes/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Canvas from '@/models/Canvas';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  await dbConnect();
  try {
    const { position, content } = await req.json();
    const newNode = {
      id: randomUUID(),
      type: 'idea',
      position,
      data: { content: content || '', color: '#f97316', labels: [] },
    };
    const canvas = await Canvas.findOneAndUpdate(
      {},
      { $push: { nodes: newNode } },
      { new: true, upsert: true }
    );
    return NextResponse.json({ success: true, data: newNode }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create node' }, { status: 400 });
  }
}
```

- [ ] **Step 3: Create DELETE node route**

```typescript
// src/app/api/canvas/nodes/[id]/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Canvas from '@/models/Canvas';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  try {
    const { id } = await params;
    const canvas = await Canvas.findOneAndUpdate(
      {},
      {
        $pull: {
          nodes: { id },
          edges: { $or: [{ source: id }, { target: id }] },
        },
      },
      { new: true }
    );
    return NextResponse.json({ success: true, data: canvas });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete node' }, { status: 400 });
  }
}
```

- [ ] **Step 4: Write API tests**

```typescript
// src/__tests__/api/canvas.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT } from '@/app/api/canvas/route';
import { POST } from '@/app/api/canvas/nodes/route';
import { DELETE } from '@/app/api/canvas/nodes/[id]/route';

vi.mock('@/lib/db', () => ({ default: vi.fn().mockResolvedValue(true) }));

vi.mock('@/models/Canvas', () => ({
  __esModule: true,
  default: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    create: vi.fn(),
  },
}));

describe('Canvas API', () => {
  describe('GET /api/canvas', () => {
    it('returns existing canvas', async () => {
      const mockCanvas = { _id: '1', viewport: { x: 0, y: 0, zoom: 1 }, nodes: [], edges: [] };
      const Canvas = (await import('@/models/Canvas')).default;
      vi.mocked(Canvas.findOne).mockResolvedValue(mockCanvas);

      const response = await GET();
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockCanvas);
    });

    it('creates default canvas if none exists', async () => {
      const Canvas = (await import('@/models/Canvas')).default;
      vi.mocked(Canvas.findOne).mockResolvedValue(null);
      vi.mocked(Canvas.create).mockResolvedValue({
        viewport: { x: 0, y: 0, zoom: 1 }, nodes: [], edges: [],
      } as any);

      const response = await GET();
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('PUT /api/canvas', () => {
    it('saves canvas state', async () => {
      const Canvas = (await import('@/models/Canvas')).default;
      vi.mocked(Canvas.findOneAndUpdate).mockResolvedValue({} as any);

      const body = {
        viewport: { x: 10, y: 20, zoom: 0.5 },
        nodes: [{ id: 'n1', type: 'idea', position: { x: 0, y: 0 }, data: { content: 'test', color: '#f97316', labels: [] } }],
        edges: [],
      };
      const response = await PUT(new Request('http://localhost/api/canvas', {
        method: 'PUT',
        body: JSON.stringify(body),
      }));
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npm test -- --run src/__tests__/api/canvas.test.ts`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add src/app/api/canvas/ src/__tests__/api/canvas.test.ts
git commit -m "feat: add canvas API routes (GET, PUT, POST node, DELETE node)"
```

---

## Task 4: Basic ZCanvas Component

**Files:**
- Create: `src/components/ZCanvas.tsx`
- Modify: `src/app/page.tsx` (or relevant main page to add ZCanvas tab)

- [ ] **Step 1: Create the ZCanvas component**

```tsx
// src/components/ZCanvas.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Viewport,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CanvasNode } from './canvas/CanvasNode';
import { CanvasEdge } from './canvas/CanvasEdge';

const nodeTypes = { idea: CanvasNode };
const edgeTypes = { default: CanvasEdge };

interface CanvasData {
  viewport: Viewport;
  nodes: Node[];
  edges: Edge[];
}

function CanvasInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isDark, setIsDark] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  const { data: canvasData, isLoading } = useQuery<{ success: boolean; data: CanvasData }>({
    queryKey: ['canvas'],
    queryFn: () => fetch('/api/canvas').then(r => r.json()),
  });

  const saveMutation = useMutation({
    mutationFn: (body: { viewport: Viewport; nodes: Node[]; edges: Edge[] }) =>
      fetch('/api/canvas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['canvas'] }),
  });

  // Restore canvas on load
  useEffect(() => {
    if (canvasData?.data) {
      setNodes(canvasData.data.nodes || []);
      setEdges(canvasData.data.edges || []);
    }
  }, [canvasData, setNodes, setEdges]);

  const debouncedSave = useCallback((vp: Viewport, nds: Node[], eds: Edge[]) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveMutation.mutate({ viewport: vp, nodes: nds, edges: eds });
    }, 500);
  }, [saveMutation]);

  const onMoveEnd = useCallback((_: unknown, viewport: Viewport) => {
    debouncedSave(viewport, nodes, edges);
  }, [debouncedSave, nodes, edges]);

  const onNodesChangeHandler = useCallback((changes: Parameters<typeof onNodesChange>[0]) => {
    onNodesChange(changes);
  }, [onNodesChange]);

  const onEdgesChangeHandler = useCallback((changes: Parameters<typeof onEdgesChange>[0]) => {
    onEdgesChange(changes);
  }, [onEdgesChange]);

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className={isDark ? 'dark' : ''} style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeHandler}
        onEdgesChange={onEdgesChangeHandler}
        onMoveEnd={onMoveEnd}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={canvasData?.data?.viewport || { x: 0, y: 0, zoom: 1 }}
        fitView
        style={{ background: isDark ? '#0f172a' : '#ffffff' }}
      >
        <Background
          color={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}
          gap={24}
          size={1}
        />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(n) => (n.data?.color as string) || '#f97316'}
          maskColor={isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.1)'}
        />
      </ReactFlow>
    </div>
  );
}

export default function ZCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ZCanvas.tsx
git commit -m "feat: add basic ZCanvas component with React Flow integration"
```

---

## Task 5: CanvasNode Component

**Files:**
- Create: `src/components/canvas/CanvasNode.tsx`

- [ ] **Step 1: Create the CanvasNode component**

```tsx
// src/components/canvas/CanvasNode.tsx
import { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

export interface CanvasNodeData {
  content: string;
  color: string;
  labels: string[];
}

const COLOR_MAP = [
  { name: 'Orange', hex: '#f97316' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Teal', hex: '#14b8a6' },
  { name: 'Gray', hex: '#64748b' },
];

export function CanvasNode({ data, selected, id }: NodeProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState((data as CanvasNodeData).content);
  const [showColors, setShowColors] = useState(false);
  const nodeData = data as CanvasNodeData & { onUpdate?: (id: string, data: Partial<CanvasNodeData>) => void };

  const onDoubleClick = useCallback(() => setEditing(true), []);

  const onBlur = useCallback(() => {
    setEditing(false);
    nodeData.onUpdate?.(id, { content: text });
  }, [id, text, nodeData]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setEditing(false);
      nodeData.onUpdate?.(id, { content: text });
    }
    if (e.key === 'Escape') {
      setEditing(false);
      setText((data as CanvasNodeData).content);
    }
  }, [id, text, data, nodeData]);

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setShowColors(true);
  }, []);

  const changeColor = useCallback((hex: string) => {
    nodeData.onUpdate?.(id, { color: hex });
    setShowColors(false);
  }, [id, nodeData]);

  return (
    <div
      className="relative bg-white dark:bg-slate-800 rounded-xl shadow-md min-w-[160px] max-w-[320px]"
      style={{
        borderLeft: `6px solid ${nodeData.color}`,
        boxShadow: selected ? '0 0 0 2px #3b82f6' : '0 2px 8px rgba(0,0,0,0.08)',
      }}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-slate-400 !border-0" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-slate-400 !border-0" />
      <Handle type="source" position={Position.Right} id="right" className="!w-2 !h-2 !bg-slate-400 !border-0" />
      <Handle type="target" position={Position.Left} id="left" className="!w-2 !h-2 !bg-slate-400 !border-0" />

      <div className="p-4">
        {editing ? (
          <textarea
            className="w-full bg-transparent outline-none resize-none text-slate-900 dark:text-slate-100 font-system-ui"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            autoFocus
            rows={3}
          />
        ) : (
          <p className="text-slate-900 dark:text-slate-100 font-system-ui text-sm whitespace-pre-wrap">
            {nodeData.content || 'Double-click to edit'}
          </p>
        )}
      </div>

      {showColors && (
        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-700 rounded-lg shadow-lg p-2 flex gap-2 z-50">
          {COLOR_MAP.map(({ hex }) => (
            <button
              key={hex}
              className="w-6 h-6 rounded-full border-2 border-transparent hover:border-slate-400 transition-colors"
              style={{ backgroundColor: hex }}
              onClick={() => changeColor(hex)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/canvas/CanvasNode.tsx
git commit -m "feat: add CanvasNode with inline edit and color tag"
```

---

## Task 6: CanvasEdge Component

**Files:**
- Create: `src/components/canvas/CanvasEdge.tsx`

- [ ] **Step 1: Create the CanvasEdge component**

```tsx
// src/components/canvas/CanvasEdge.tsx
import { memo } from 'react';
import { getBezierPath, EdgeProps, EdgeLabelRenderer } from '@xyflow/react';

export function CanvasEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  animated,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        stroke={selected ? '#64748b' : '#94a3b8'}
        strokeWidth={2}
        strokeDasharray={animated ? '5 5' : undefined}
        fill="none"
        markerEnd="url(#arrowclosed)"
        style={animated ? { animation: 'dash 0.5s linear infinite' } : undefined}
      />
      <defs>
        <marker
          id="arrowclosed"
          viewBox="0 0 12 12"
          refX="10"
          refY="6"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 2 0 L 12 6 L 2 12 z" fill="#94a3b8" />
        </marker>
      </defs>
      {label && (
        <EdgeLabelRenderer>
          <div
            className="absolute px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs text-slate-600 dark:text-slate-300 font-medium pointer-events-all"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: -10; }
        }
      `}</style>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/canvas/CanvasEdge.tsx
git commit -m "feat: add CanvasEdge with bezier path and arrow marker"
```

---

## Task 7: CanvasToolbar Component

**Files:**
- Create: `src/components/canvas/CanvasToolbar.tsx`
- Modify: `src/components/ZCanvas.tsx` (integrate toolbar)

- [ ] **Step 1: Create the toolbar component**

```tsx
// src/components/canvas/CanvasToolbar.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { addNode } from '@/lib/canvasUtils';

export function CanvasToolbar() {
  const [visible, setVisible] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const { fitView, getViewport } = useReactFlow();
  const timeoutRef = { current: null as ReturnType<typeof setTimeout> | null };

  useEffect(() => {
    const handleMouseMove = () => {
      if (!isHovered) setVisible(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (!isHovered) setVisible(false);
      }, 3000);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isHovered]);

  const toggleDark = useCallback(() => {
    setIsDark(prev => {
      document.documentElement.classList.toggle('dark', !prev);
      return !prev;
    });
  }, []);

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200/50"
            style={{
              background: isDark ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(12px)',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <button
              onClick={() => addNode(getViewport())}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              <span>+</span> Add Node
            </button>
            <button
              onClick={() => fitView({ padding: 0.2 })}
              className="px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm transition-colors"
            >
              Fit View
            </button>
            <button
              onClick={toggleDark}
              className="px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm transition-colors"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save status toast */}
      <AnimatePresence>
        {saveStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-4 right-4 text-xs text-slate-500 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full shadow"
          >
            {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

- [ ] **Step 2: Create canvas utility function**

```typescript
// src/lib/canvasUtils.ts
import { Viewport } from '@xyflow/react';
import { randomUUID } from 'crypto';

export function addNode(viewport: Viewport) {
  const centerX = (-viewport.x + window.innerWidth / 2) / viewport.zoom;
  const centerY = (-viewport.y + window.innerHeight / 2) / viewport.zoom;

  const newNode = {
    id: randomUUID(),
    type: 'idea',
    position: { x: centerX - 80, y: centerY - 40 },
    data: { content: '', color: '#f97316', labels: [] },
  };

  // Dispatch custom event for ZCanvas to pick up
  window.dispatchEvent(new CustomEvent('canvas:addNode', { detail: newNode }));
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/canvas/CanvasToolbar.tsx src/lib/canvasUtils.ts
git commit -m "feat: add floating canvas toolbar with dark mode toggle"
```

---

## Task 8: Double-click Create + Inline Text Input

**Files:**
- Modify: `src/components/ZCanvas.tsx`

- [ ] **Step 1: Add double-click create to ZCanvas**

In the `CanvasInner` component, add an `onPaneClick` handler and inline creation state:

```tsx
// Add to CanvasInner:
const [creatingNode, setCreatingNode] = useState<{ x: number; y: number; text: string } | null>(null);
const { screenToFlowPosition } = useReactFlow();

const onPaneDoubleClick = useCallback((event: React.MouseEvent) => {
  const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
  setCreatingNode({ x: position.x, y: position.y, text: '' });
}, [screenToFlowPosition]);

// Add to ReactFlow: onDoubleClick={onPaneDoubleClick}

// Add creation input UI after ReactFlow:
{creatingNode && (
  <div
    className="absolute bg-white dark:bg-slate-800 rounded-xl shadow-xl p-4 min-w-[200px] z-50"
    style={{ left: creatingNode.x, top: creatingNode.y, transform: 'translate(-50%, -50%)' }}
  >
    <textarea
      autoFocus
      placeholder="Type your idea..."
      className="bg-transparent outline-none text-slate-900 dark:text-slate-100 w-full resize-none text-sm"
      value={creatingNode.text}
      onChange={(e) => setCreatingNode(prev => prev ? { ...prev, text: e.target.value } : null)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (creatingNode.text.trim()) {
            const newNode = { id: crypto.randomUUID(), type: 'idea' as const, position: { x: creatingNode.x, y: creatingNode.y }, data: { content: creatingNode.text.trim(), color: '#f97316', labels: [] as string[] } };
            setNodes(nds => [...nds, newNode]);
          }
          setCreatingNode(null);
        }
        if (e.key === 'Escape') setCreatingNode(null);
      }}
      rows={3}
    />
  </div>
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ZCanvas.tsx
git commit -m "feat: add double-click node creation with inline text input"
```

---

## Task 9: Keyboard Shortcuts + Delete

**Files:**
- Modify: `src/components/ZCanvas.tsx`

- [ ] **Step 1: Add keyboard shortcuts**

```tsx
// Add to CanvasInner useEffect:
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Delete selected nodes
    if ((e.key === 'Delete' || e.key === 'Backspace') && e.target === document.body) {
      const selectedNodes = nodes.filter(n => n.selected);
      if (selectedNodes.length > 0) {
        setNodes(nds => nds.filter(n => !n.selected));
        setEdges(eds => eds.filter(ed =>
          !selectedNodes.some(n => n.id === ed.source || n.id === ed.target)
        ));
      }
    }
    // Fit view
    if (e.key === 'f' || e.key === 'F') {
      fitView({ padding: 0.2 });
    }
    // Escape
    if (e.key === 'Escape') {
      setNodes(nds => nds.map(n => ({ ...n, selected: false })));
      setCreatingNode(null);
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [nodes, fitView]);
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ZCanvas.tsx
git commit -m "feat: add keyboard shortcuts (Delete, F, Escape)"
```

---

## Task 10: Command Palette

**Files:**
- Create: `src/components/canvas/CommandPalette.tsx`
- Modify: `src/components/ZCanvas.tsx`

- [ ] **Step 1: Create CommandPalette component**

```tsx
// src/components/canvas/CommandPalette.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CommandPaletteProps {
  nodes: Array<{ id: string; data: { content: string }; position: { x: number; y: number } }>;
  onCreateNode: (content: string) => void;
  onClose: () => void;
}

export function CommandPalette({ nodes, onCreateNode, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = nodes.filter(n =>
    n.data.content.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex === filtered.length && query.trim()) {
        onCreateNode(query.trim());
      }
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [filtered.length, selectedIndex, query, onCreateNode, onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
        onClick={onClose}
      >
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
          <div className="p-3 border-b border-slate-100 dark:border-slate-700">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search ideas or create new..."
              className="w-full bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
              onKeyDown={handleKeyDown}
            />
          </div>
          <ul className="max-h-64 overflow-y-auto p-2">
            {filtered.slice(0, 5).map((node, i) => (
              <li
                key={node.id}
                className={`px-3 py-2 rounded-lg cursor-pointer text-sm ${i === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-slate-700 dark:text-slate-300'}`}
                onClick={() => onClose()}
              >
                {node.data.content || '(empty)'}
              </li>
            ))}
            {query.trim() && (
              <li
                className={`px-3 py-2 rounded-lg cursor-pointer text-sm mt-1 ${selectedIndex === filtered.length ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-slate-700 dark:text-slate-300'}`}
                onClick={() => { onCreateNode(query.trim()); onClose(); }}
              >
                + Create "{query}"
              </li>
            )}
          </ul>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Wire Ctrl+K in ZCanvas**

```tsx
// Add to ZCanvas useEffect:
useEffect(() => {
  const handleKey = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setShowPalette(true);
    }
  };
  window.addEventListener('keydown', handleKey);
  return () => window.removeEventListener('keydown', handleKey);
}, []);

// Add state: const [showPalette, setShowPalette] = useState(false);
```

- [ ] **Step 3: Commit**

```bash
git add src/components/canvas/CommandPalette.tsx src/components/ZCanvas.tsx
git commit -m "feat: add command palette for search and quick node creation"
```

---

## Task 11: Node Update Handler + Context Menu Delete

**Files:**
- Modify: `src/components/ZCanvas.tsx`
- Modify: `src/components/canvas/CanvasNode.tsx`

- [ ] **Step 1: Add onNodeUpdate callback**

The CanvasNode receives an `onUpdate` callback in its data. Wire it in ZCanvas so node edits are reflected immediately and trigger debounced save:

```tsx
// In CanvasInner, add:
const onNodeUpdate = useCallback((id: string, data: Partial<CanvasNodeData>) => {
  setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n));
}, []);
```

Pass `onNodeUpdate` to each node via the `defaultEdgeOptions` or as node data.

- [ ] **Step 2: Add right-click delete to CanvasNode**

In `CanvasNode.tsx`, add to the context menu:

```tsx
// In the color picker menu, add a divider and delete button:
<div className="flex gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-600">
  <button
    className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded"
    onClick={() => {
      window.dispatchEvent(new CustomEvent('canvas:deleteNode', { detail: id }));
    }}
  >
    Delete
  </button>
</div>
```

Handle the delete event in ZCanvas:

```tsx
useEffect(() => {
  const handleDelete = (e: Event) => {
    const id = (e as CustomEvent).detail;
    setNodes(nds => nds.filter(n => n.id !== id));
    setEdges(eds => eds.filter(ed => ed.source !== id && ed.target !== id));
  };
  window.addEventListener('canvas:deleteNode', handleDelete);
  return () => window.removeEventListener('canvas:deleteNode', handleDelete);
}, []);
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ZCanvas.tsx src/components/canvas/CanvasNode.tsx
git commit -m "feat: add node update handler and right-click delete"
```

---

## Task 12: Polish — Auto-save Indicator + Fit View on Empty

**Files:**
- Modify: `src/components/ZCanvas.tsx`
- Modify: `src/components/canvas/CanvasToolbar.tsx`

- [ ] **Step 1: Add save status indicator to ZCanvas**

```tsx
// Add saveStatus state and mutation callbacks:
const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

const saveMutation = useMutation({
  // ... existing config
  onMutate: () => setSaveStatus('saving'),
  onSuccess: () => {
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  },
});
```

- [ ] **Step 2: Pass save status to toolbar or show inline**

Add a `saveStatus` prop to the toolbar component.

- [ ] **Step 3: Commit**

```bash
git add src/components/ZCanvas.tsx src/components/canvas/CanvasToolbar.tsx
git commit -m "feat: add save status indicator to canvas"
```

---

## Self-Review Checklist

- [ ] Spec coverage: All sections from spec have corresponding tasks
- [ ] No placeholders: All code is complete, no "TBD" or "TODO"
- [ ] Type consistency: `CanvasNodeData`, `Viewport`, `Node`, `Edge` types consistent across all tasks
- [ ] API pattern matches existing project: `{ success: boolean, data?: any, error?: any }`
- [ ] Mongoose pattern matches existing: `mongoose.models.Canvas || mongoose.model(...)`
- [ ] DB connection: `dbConnect()` called in every API route
- [ ] React Flow imports: uses `@xyflow/react` (React Flow v12)
