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
