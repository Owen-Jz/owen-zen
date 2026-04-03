// src/components/ZCanvas.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlow, Background, Controls, MiniMap, Node, Edge, Viewport, ReactFlowProvider, useReactFlow, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CanvasNode } from './canvas/CanvasNode';
import { CanvasEdge } from './canvas/CanvasEdge';
import { CommandPalette } from './canvas/CommandPalette';
import { CanvasToolbar } from './canvas/CanvasToolbar';

const nodeTypes = { idea: CanvasNode };
const edgeTypes = { default: CanvasEdge };

interface CanvasData {
  viewport: Viewport;
  nodes: Node[];
  edges: Edge[];
}

function CanvasInner() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isDark, setIsDark] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [creatingNode, setCreatingNode] = useState<{ x: number; y: number; text: string } | null>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();
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
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    onError: () => setSaveStatus('idle'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['canvas'] }),
  });

  // Restore canvas on load
  useEffect(() => {
    if (canvasData?.data) {
      setNodes(canvasData.data.nodes || []);
      setEdges(canvasData.data.edges || []);
    }
  }, [canvasData]);

  // Debounced save
  const debouncedSave = useCallback((vp: Viewport, nds: Node[], eds: Edge[]) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveMutation.mutate({ viewport: vp, nodes: nds, edges: eds });
    }, 500);
  }, [saveMutation]);

  const onMoveEnd = useCallback((_: unknown, viewport: Viewport) => {
    debouncedSave(viewport, nodes, edges);
  }, [debouncedSave, nodes, edges]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes(nds => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges(eds => applyEdgeChanges(changes, eds));
  }, []);

  // Ctrl+K to open command palette
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

  // Keyboard shortcuts: Delete, F, Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && e.target === document.body) {
        const selectedNodes = nodes.filter(n => n.selected);
        if (selectedNodes.length > 0) {
          setNodes(nds => nds.filter(n => !n.selected));
          setEdges(eds => eds.filter(ed =>
            !selectedNodes.some(n => n.id === ed.source || n.id === ed.target)
          ));
        }
      }
      if (e.key === 'f' || e.key === 'F') {
        fitView({ padding: 0.2 });
      }
      if (e.key === 'Escape') {
        setNodes(nds => nds.map(n => ({ ...n, selected: false })));
        setCreatingNode(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, fitView]);

  const onCreateFromPalette = useCallback((content: string) => {
    const viewport = { x: 0, y: 0, zoom: 1 };
    const centerX = (-viewport.x + window.innerWidth / 2) / viewport.zoom;
    const centerY = (-viewport.y + window.innerHeight / 2) / viewport.zoom;
    const newNode = { id: crypto.randomUUID(), type: 'idea' as const, position: { x: centerX - 80, y: centerY - 40 }, data: { content, color: '#f97316', labels: [] as string[] } };
    setNodes(nds => [...nds, newNode]);
  }, []);

  const onPaneDoubleClick = useCallback((event: React.MouseEvent) => {
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    setCreatingNode({ x: position.x, y: position.y, text: '' });
  }, [screenToFlowPosition]);

  const onNodeUpdate = useCallback((id: string, data: { content?: string; color?: string }) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n));
  }, []);

  // Listen for delete custom event
  useEffect(() => {
    const handleDelete = (e: Event) => {
      const id = (e as CustomEvent).detail;
      setNodes(nds => nds.filter(n => n.id !== id));
      setEdges(eds => eds.filter(ed => ed.source !== id && ed.target !== id));
    };
    window.addEventListener('canvas:deleteNode', handleDelete);
    return () => window.removeEventListener('canvas:deleteNode', handleDelete);
  }, []);

  // Listen for add node custom event (from toolbar)
  useEffect(() => {
    const handleAddNode = (e: Event) => {
      const node = (e as CustomEvent).detail;
      setNodes(nds => [...nds, node]);
    };
    window.addEventListener('canvas:addNode', handleAddNode);
    return () => window.removeEventListener('canvas:addNode', handleAddNode);
  }, []);

  // Pass onUpdate to all nodes so CanvasNode can call it
  const nodesWithCallbacks = nodes.map(n => ({
    ...n,
    data: { ...n.data, onUpdate: onNodeUpdate },
  }));

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className={isDark ? 'dark' : ''} style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodesWithCallbacks}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onMoveEnd={onMoveEnd}
        onDoubleClick={onPaneDoubleClick}
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
      {saveStatus !== 'idle' && (
        <div className="fixed bottom-4 right-4 text-xs text-slate-500 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full shadow">
          {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
        </div>
      )}
      <CanvasToolbar saveStatus={saveStatus} />
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
      {showPalette && (
        <CommandPalette
          nodes={nodes}
          onCreateNode={onCreateFromPalette}
          onClose={() => setShowPalette(false)}
        />
      )}
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
