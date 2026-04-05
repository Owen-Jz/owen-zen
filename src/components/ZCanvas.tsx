// src/components/ZCanvas.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlow, Background, BackgroundVariant, Controls, MiniMap, Node, Edge, Viewport, ReactFlowProvider, useReactFlow, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, Connection, OnConnect } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CanvasNode } from './canvas/CanvasNode';
import { CanvasEdge } from './canvas/CanvasEdge';
import { CanvasToolbar } from './canvas/CanvasToolbar';
import { NodeModal } from './canvas/NodeModal';

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
  const [showHelp, setShowHelp] = useState(false);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [creatingNode, setCreatingNode] = useState<{ x: number; y: number; text: string } | null>(null);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const { screenToFlowPosition, fitView, getViewport } = useReactFlow();
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
    setNodes(nds => {
      const updated = applyNodeChanges(changes, nds);
      debouncedSave(getViewport(), updated, edges);
      return updated;
    });
  }, [debouncedSave, getViewport, edges]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges(eds => {
      const updated = applyEdgeChanges(changes, eds);
      debouncedSave(getViewport(), nodes, updated);
      return updated;
    });
  }, [debouncedSave, getViewport, nodes]);

  // Delete selected edges with Delete/Backspace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && e.target === document.body) {
        const selectedNodes = nodes.filter(n => n.selected);
        const selectedEdges = edges.filter(ed => ed.selected);
        if (selectedNodes.length > 0) {
          setNodes(nds => nds.filter(n => !n.selected));
          setEdges(eds => eds.filter(ed =>
            !selectedNodes.some(n => n.id === ed.source || n.id === ed.target)
          ));
        } else if (selectedEdges.length > 0) {
          setEdges(eds => eds.filter(ed => !ed.selected));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, edges]);

  const onConnect: OnConnect = useCallback((connection: Connection) => {
    setEdges(eds => {
      const updated = eds.concat({
        ...connection,
        id: crypto.randomUUID(),
        type: 'default',
        animated: false,
      } as Edge);
      debouncedSave(getViewport(), nodes, updated);
      return updated;
    });
  }, [debouncedSave, getViewport, nodes]);

  // Handle drop to stack node inside another
  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData('application/canvas-node');
    const targetId = event.dataTransfer.getData('application/canvas-target');
    if (!draggedId || !targetId || draggedId === targetId) {
      setDragNodeId(null);
      return;
    }
    setNodes(nds => {
      let updated = nds.map(n => {
        if ((n.data as { childIds?: string[] }).childIds?.includes(draggedId)) {
          return { ...n, data: { ...n.data, childIds: (n.data as { childIds: string[] }).childIds.filter((c: string) => c !== draggedId) } };
        }
        return n;
      });
      updated = updated.map(n => {
        if (n.id === targetId) {
          const children = (n.data as { childIds?: string[] }).childIds || [];
          return { ...n, data: { ...n.data, childIds: [...children, draggedId] } };
        }
        if (n.id === draggedId) {
          return { ...n, data: { ...n.data, parentId: targetId } };
        }
        return n;
      });
      return updated;
    });
    setDragNodeId(null);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onNodeDragStart = useCallback((_event: React.MouseEvent, node: Node) => {
    setDragNodeId(node.id);
  }, []);
  // F and Escape shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        fitView({ padding: 0.2 });
      }
      if (e.key === 'Escape') {
        setNodes(nds => nds.map(n => ({ ...n, selected: false })));
        setEdges(eds => eds.map(ed => ({ ...ed, selected: false })));
        setCreatingNode(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fitView]);

  const onPaneDoubleClick = useCallback((event: React.MouseEvent) => {
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    setCreatingNode({ x: position.x, y: position.y, text: '' });
  }, [screenToFlowPosition]);

  const onPaneMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start marquee if clicking directly on the pane background
    const target = e.target as HTMLElement;
    if (!target.classList.contains('react-flow__pane') && !target.classList.contains('react-flow__background')) return;

    // Don't start if clicking with modifier keys (allow browser gestures)
    if (e.altKey || e.ctrlKey || e.metaKey) return;

    setIsSelecting(true);
    setSelectionStart({ x: e.clientX, y: e.clientY });
    setSelectionRect({ x: e.clientX, y: e.clientY, width: 0, height: 0 });
  }, []);

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
        return { ...n, selected: inside };
      }));

      // Select edges whose midpoint falls inside the rect
      setEdges(eds => eds.map(ed => {
        const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } = ed;
        // Approximate bezier midpoint in screen space
        const hDist = Math.abs(targetX - sourceX) * 0.5;
        const cp1x = sourceX + (sourcePosition === 'left' ? -hDist : sourcePosition === 'right' ? hDist : 0);
        const cp1y = sourceY;
        const cp2x = targetX + (targetPosition === 'left' ? -hDist : targetPosition === 'right' ? hDist : 0);
        const cp2y = targetY;
        const screenSource = toScreen(sourceX, sourceY);
        const screenTarget = toScreen(targetX, targetY);
        const screenCp1 = toScreen(cp1x, cp1y);
        const screenCp2 = toScreen(cp2x, cp2y);
        const midX = 0.125 * screenSource.x + 0.375 * screenCp1.x + 0.375 * screenCp2.x + 0.125 * screenTarget.x;
        const midY = 0.125 * screenSource.y + 0.375 * screenCp1.y + 0.375 * screenCp2.y + 0.125 * screenTarget.y;
        const inside = midX >= x && midX <= x + width && midY >= y && midY <= y + height;
        return { ...ed, selected: inside };
      }));
    }

    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionRect(null);
  }, [isSelecting, selectionRect, getViewport]);

  const onNodeUpdate = useCallback((id: string, data: { content?: string; color?: string; subNodes?: { id: string; content: string; color: string }[] }) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n));
  }, []);

  const handleDeleteSubNode = useCallback((parentId: string, subNodeId: string) => {
    setNodes(nds => nds.map(n => {
      if (n.id !== parentId) return n;
      const subNodes = (n.data as { subNodes?: { id: string; content: string; color: string }[] }).subNodes || [];
      return {
        ...n,
        data: { ...n.data, subNodes: subNodes.filter(s => s.id !== subNodeId) },
      };
    }));
  }, []);

  const handleUpdateSubNode = useCallback((parentId: string, subNodeId: string, content: string) => {
    setNodes(nds => nds.map(n => {
      if (n.id !== parentId) return n;
      const subNodes = (n.data as { subNodes?: { id: string; content: string; color: string }[] }).subNodes || [];
      return {
        ...n,
        data: { ...n.data, subNodes: subNodes.map(s => s.id === subNodeId ? { ...s, content } : s) },
      };
    }));
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

  const handleDeleteEdge = useCallback((e: Event) => {
    const id = (e as CustomEvent).detail;
    setEdges(eds => eds.filter(ed => ed.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => handleDeleteEdge(e);
    window.addEventListener('canvas:deleteEdge', handler);
    return () => window.removeEventListener('canvas:deleteEdge', handler);
  }, [handleDeleteEdge]);

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

  useEffect(() => {
    const handler = (e: Event) => handleDuplicateNode(e);
    window.addEventListener('canvas:duplicateNode', handler);
    return () => window.removeEventListener('canvas:duplicateNode', handler);
  }, [handleDuplicateNode]);

  // Listen for add node custom event (from toolbar)
  useEffect(() => {
    const handleAddNode = (e: Event) => {
      const node = (e as CustomEvent).detail;
      setNodes(nds => [...nds, node]);
    };
    window.addEventListener('canvas:addNode', handleAddNode);
    return () => window.removeEventListener('canvas:addNode', handleAddNode);
  }, []);

  // Listen for stack node event
  useEffect(() => {
    const handleStack = (e: Event) => {
      const { draggedId, targetId } = (e as CustomEvent).detail;
      if (!draggedId || !targetId || draggedId === targetId) return;
      setNodes(nds => {
        let updated = nds.map(n => {
          if ((n.data as { childIds?: string[] }).childIds?.includes(draggedId)) {
            return { ...n, data: { ...n.data, childIds: (n.data as { childIds: string[] }).childIds.filter((c: string) => c !== draggedId) } };
          }
          return n;
        });
        updated = updated.map(n => {
          if (n.id === targetId) {
            const children = (n.data as { childIds?: string[] }).childIds || [];
            return { ...n, data: { ...n.data, childIds: [...children, draggedId] } };
          }
          if (n.id === draggedId) {
            return { ...n, data: { ...n.data, parentId: targetId } };
          }
          return n;
        });
        return updated;
      });
    };
    window.addEventListener('canvas:stackNode', handleStack);
    return () => window.removeEventListener('canvas:stackNode', handleStack);
  }, []);

  // Listen for add sub node event — adds to parent's subNodes array (virtual, not a canvas node)
  useEffect(() => {
    const handleAddSubNode = (e: Event) => {
      const { parentId, color, content } = (e as CustomEvent).detail;
      setNodes(nds => nds.map(n => {
        if (n.id !== parentId) return n;
        const subNodes = (n.data as { subNodes?: { id: string; content: string; color: string }[] }).subNodes || [];
        return {
          ...n,
          data: {
            ...n.data,
            subNodes: [...subNodes, { id: crypto.randomUUID(), content: content || '', color: color || '#f97316' }],
          },
        };
      }));
    };
    window.addEventListener('canvas:addSubNode', handleAddSubNode);
    return () => window.removeEventListener('canvas:addSubNode', handleAddSubNode);
  }, []);

  // Listen for open node modal event
  useEffect(() => {
    const handleOpenModal = (e: Event) => {
      const { nodeId } = (e as CustomEvent).detail;
      setSelectedNodeId(nodeId);
      setShowNodeModal(true);
    };
    window.addEventListener('canvas:openNodeModal', handleOpenModal);
    return () => window.removeEventListener('canvas:openNodeModal', handleOpenModal);
  }, []);

  // Pass onUpdate to all nodes so CanvasNode can call it
  const nodesWithCallbacks = nodes.map(n => ({
    ...n,
    data: { ...n.data, onUpdate: onNodeUpdate },
  }));

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodesWithCallbacks}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onMoveEnd={onMoveEnd}
        onDoubleClick={onPaneDoubleClick}
        onMouseDown={onPaneMouseDown}
        onMouseMove={onPaneMouseMove}
        onMouseUp={onPaneMouseUp}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeDragStart={onNodeDragStart}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={canvasData?.data?.viewport || { x: 0, y: 0, zoom: 1 }}
        fitView
        style={{ background: 'var(--background)' }}
      >
        <Background
          variant={BackgroundVariant.Lines}
          color="rgba(255,255,255,0.06)"
          gap={32}
          size={1}
          style={{ opacity: 0.6 }}
        />
        <Controls style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }} showInteractive={false} />
        <MiniMap
          nodeColor={(n) => (n.data?.color as string) || '#f97316'}
          maskColor="rgba(0,0,0,0.5)"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
        />
      </ReactFlow>
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
      {creatingNode && (
        <div
          className="absolute rounded-xl shadow-xl p-4 min-w-[200px] z-50"
          style={{ left: creatingNode.x, top: creatingNode.y, transform: 'translate(-50%, -50%)', background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <textarea
            autoFocus
            placeholder="Type your idea..."
            className="bg-transparent outline-none w-full resize-none text-sm"
            style={{ color: 'var(--foreground)' }}
            value={creatingNode.text}
            onChange={(e) => setCreatingNode(prev => prev ? { ...prev, text: e.target.value } : null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (creatingNode.text.trim()) {
                  const newNode = { id: crypto.randomUUID(), type: 'idea' as const, position: { x: creatingNode.x, y: creatingNode.y }, data: { content: creatingNode.text.trim(), color: '#f97316', labels: [] as string[], subNodes: [] as { id: string; content: string; color: string }[] } };
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
      {showHelp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={() => setShowHelp(false)}>
          <div className="rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Canvas Controls</h2>
              <button onClick={() => setShowHelp(false)} className="text-xl leading-none" style={{ color: 'var(--gray-500)' }}>&times;</button>
            </div>
            <div className="space-y-4 text-sm" style={{ color: 'var(--gray-400)' }}>
              <div className="flex gap-3 items-start">
                <span className="px-2 py-1 rounded text-xs font-mono min-w-[60px] text-center" style={{ background: 'var(--gray-800)', color: '#f97316' }}>Double-click</span>
                <span>Create a new idea node anywhere on the canvas</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="px-2 py-1 rounded text-xs font-mono min-w-[60px] text-center" style={{ background: 'var(--gray-800)', color: '#f97316' }}>Drag</span>
                <span>Pan around the canvas freely</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="px-2 py-1 rounded text-xs font-mono min-w-[60px] text-center" style={{ background: 'var(--gray-800)', color: '#f97316' }}>Scroll</span>
                <span>Zoom in and out</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="px-2 py-1 rounded text-xs font-mono min-w-[60px] text-center" style={{ background: 'var(--gray-800)', color: '#f97316' }}>F</span>
                <span>Fit all nodes into view</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="px-2 py-1 rounded text-xs font-mono min-w-[60px] text-center" style={{ background: 'var(--gray-800)', color: '#f97316' }}>Del</span>
                <span>Delete selected node(s)</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="px-2 py-1 rounded text-xs font-mono min-w-[60px] text-center" style={{ background: 'var(--gray-800)', color: '#f97316' }}>Alt + Click</span>
                <span>Duplicate this node</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="px-2 py-1 rounded text-xs font-mono min-w-[60px] text-center" style={{ background: 'var(--gray-800)', color: '#f97316' }}>Dbl Click edge</span>
                <span>Delete the connection</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="px-2 py-1 rounded text-xs font-mono min-w-[60px] text-center" style={{ background: 'var(--gray-800)', color: '#f97316' }}>Esc</span>
                <span>Deselect all / cancel node creation</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="px-2 py-1 rounded text-xs font-mono min-w-[60px] text-center" style={{ background: 'var(--gray-800)', color: '#f97316' }}>Click + Drag</span>
                <span>Draw rectangle to select multiple nodes and edges</span>
              </div>
              <div className="pt-4 mt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Node interactions:</p>
                <div className="space-y-2">
                  <div className="flex gap-3 items-start">
                    <span className="px-2 py-1 rounded text-xs font-mono min-w-[60px] text-center" style={{ background: 'var(--gray-800)', color: '#f97316' }}>Double-click node</span>
                    <span>Edit node text inline</span>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="px-2 py-1 rounded text-xs font-mono min-w-[60px] text-center" style={{ background: 'var(--gray-800)', color: '#f97316' }}>Right-click node</span>
                    <span>Change node color (8 colors) or delete</span>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="px-2 py-1 rounded text-xs font-mono min-w-[60px] text-center" style={{ background: 'var(--gray-800)', color: '#f97316' }}>Drag handles</span>
                    <span>Drag from node edge to another node to connect them</span>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="px-2 py-1 rounded text-xs font-mono min-w-[60px] text-center" style={{ background: 'var(--gray-800)', color: '#f97316' }}>Drag node</span>
                    <span>Drag a node onto another to stack it inside (one level deep)</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-6 w-full font-semibold py-2.5 rounded-xl transition-colors"
              style={{ background: '#dc2626', color: 'white' }}
            >
              Got it, let's start
            </button>
          </div>
        </div>
      )}
      {showNodeModal && selectedNodeId && (() => {
        const node = nodes.find(n => n.id === selectedNodeId);
        if (!node) return null;
        const nodeData = node.data as { content: string; color: string; labels: string[]; subNodes?: { id: string; content: string; color: string }[] };
        const childNodes = (nodeData.subNodes || [])
          .map(s => ({ id: s.id, content: s.content, color: s.color }));
        return (
          <NodeModal
            nodeId={selectedNodeId}
            data={nodeData as { content: string; color: string; labels: string[]; subNodes?: { id: string; content: string; color: string }[] }}
            childNodes={childNodes}
            onClose={() => { setShowNodeModal(false); setSelectedNodeId(null); }}
            onUpdate={onNodeUpdate}
            onDelete={(id) => {
              window.dispatchEvent(new CustomEvent('canvas:deleteNode', { detail: id }));
              setShowNodeModal(false);
              setSelectedNodeId(null);
            }}
            onAddSubNode={(parentId, color, content) => {
              window.dispatchEvent(new CustomEvent('canvas:addSubNode', { detail: { parentId, color, content } }));
            }}
            onDeleteSubNode={handleDeleteSubNode}
            onUpdateSubNode={handleUpdateSubNode}
          />
        );
      })()}
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
