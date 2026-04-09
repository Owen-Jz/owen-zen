// src/components/ZCanvas.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlow, Background, BackgroundVariant, Controls, MiniMap, Node, Edge, Viewport, ReactFlowProvider, useReactFlow, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, Connection, OnConnect, SelectionMode } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CanvasNode } from './canvas/CanvasNode';
import { CanvasEdge } from './canvas/CanvasEdge';
import { CanvasToolbar } from './canvas/CanvasToolbar';
import { NodeModal } from './canvas/NodeModal';
import BottomDock from './canvas/BottomDock';
import { Task } from '@/types';

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
  const [chatMessagesMap, setChatMessagesMap] = useState<Record<string, { role: 'user' | 'assistant'; content: string }[]>>({});
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [creatingNode, setCreatingNode] = useState<{ x: number; y: number; text: string } | null>(null);
  const [isMarqueeActive, setIsMarqueeActive] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<Set<string>>(new Set());
  const { fitView, getViewport } = useReactFlow();
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();
  const isUpdatingSelection = useRef(false);

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

      // Initialize chatMessagesMap from nodes' messages data
      const messagesMap: Record<string, { role: 'user' | 'assistant'; content: string }[]> = {};
      (canvasData.data.nodes || []).forEach((node: Node) => {
        const nodeData = node.data as { messages?: { role: 'user' | 'assistant'; content: string }[] };
        if (nodeData?.messages && nodeData.messages.length > 0) {
          messagesMap[node.id] = nodeData.messages;
        }
      });
      setChatMessagesMap(messagesMap);
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
        if (selectedNodeIds.size > 0) {
          setNodes(nds => nds.filter(n => !selectedNodeIds.has(n.id)));
          setEdges(eds => eds.filter(ed =>
            !selectedNodeIds.has(ed.source) && !selectedNodeIds.has(ed.target)
          ));
          setSelectedNodeIds(new Set());
          setSelectedEdgeIds(new Set());
        } else if (selectedEdgeIds.size > 0) {
          setEdges(eds => eds.filter(ed => !selectedEdgeIds.has(ed.id)));
          setSelectedEdgeIds(new Set());
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds, selectedEdgeIds]);

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

  // ReactFlow built-in selection callbacks for marquee
  const onSelectionStart = useCallback(() => {
    if (isMarqueeActive) {
      setIsSelecting(true);
    }
  }, [isMarqueeActive]);

  const onSelectionEnd = useCallback(() => {
    if (isMarqueeActive) {
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionRect(null);
    }
  }, [isMarqueeActive]);

  // Sync ReactFlow's internal selection with our external state
  const onSelectionChange = useCallback(({ nodes: selectedNodes, edges: selectedEdges }: { nodes: Node[]; edges: Edge[] }) => {
    if (isUpdatingSelection.current) return;
    isUpdatingSelection.current = true;

    const nodeIds = new Set(selectedNodes.map(n => n.id));
    const edgeIds = new Set(selectedEdges.map(e => e.id));

    setSelectedNodeIds(nodeIds);
    setSelectedEdgeIds(edgeIds);

    // Update nodes with selected property for visual highlighting
    setNodes(nds => nds.map(n => ({ ...n, selected: nodeIds.has(n.id) })));

    setTimeout(() => {
      isUpdatingSelection.current = false;
    }, 0);
  }, []);

  // F and Escape shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        fitView({ padding: 0.2 });
      }
      if (e.key === 'Escape') {
        setSelectedNodeIds(new Set());
        setSelectedEdgeIds(new Set());
        setCreatingNode(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fitView]);

  const onNodeUpdate = useCallback((id: string, data: { content?: string; color?: string; subNodes?: { id: string; content: string; color: string }[] }) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n));
  }, []);

  // Update node messages and persist to database
  const onNodeMessagesUpdate = useCallback((id: string, messages: { role: 'user' | 'assistant'; content: string }[]) => {
    const updatedNodes = nodes.map(n => n.id === id ? { ...n, data: { ...n.data, messages } } : n);
    setNodes(updatedNodes);
    // Immediately save to persist messages
    saveMutation.mutate({ viewport: getViewport(), nodes: updatedNodes, edges });
  }, [nodes, edges, getViewport, saveMutation]);

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

  // Create a canvas node from a task in the dock
  const handleCreateNodeFromTask = useCallback((task: Task, position: { x: number; y: number }) => {
    const subNodes = (task.subtasks ?? []).map((st: { title: string; completed: boolean }) => ({
      id: crypto.randomUUID(),
      content: st.title,
      color: '#f97316',
    }));
    const newNode: Node = {
      id: crypto.randomUUID(),
      type: 'idea',
      position,
      data: {
        content: task.title,
        color: '#f97316',
        labels: [],
        subNodes,
      },
    };
    setNodes(nds => [...nds, newNode]);
    // Delete the task from the board
    fetch(`/api/tasks/${task._id}`, { method: 'DELETE' }).catch(console.error);
    // Refetch dock tasks
    queryClient.invalidateQueries({ queryKey: ['dock-tasks'] });
  }, [queryClient]);

  // Listen for add task node (from dock)
  useEffect(() => {
    const handleAddTaskNode = (e: Event) => {
      const { task, position } = (e as CustomEvent).detail;
      const viewport = getViewport();
      const absPosition = { x: viewport.x + position.x, y: viewport.y + position.y };
      handleCreateNodeFromTask(task, absPosition);
    };
    window.addEventListener('canvas:addTaskNode', handleAddTaskNode);
    return () => window.removeEventListener('canvas:addTaskNode', handleAddTaskNode);
  }, [handleCreateNodeFromTask, getViewport]);

  // Create a task from a canvas node (dropped on dock)
  const handleCreateTaskFromNode = useCallback((nodeId: string, _position: { x: number; y: number }) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const nodeData = node.data as { content: string; subNodes?: { id: string; content: string; color: string }[] };
    const subtasks = (nodeData.subNodes ?? []).map((sn: { id: string; content: string; color: string }) => ({
      title: sn.content,
      completed: false,
    }));
    fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: nodeData.content, status: 'mind-map', subtasks }),
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['dock-tasks'] });
      window.dispatchEvent(new CustomEvent('canvas:deleteNode', { detail: nodeId }));
    }).catch(console.error);
  }, [nodes, queryClient]);

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

  // Toggle marquee selection mode
  const toggleMarquee = useCallback(() => {
    setIsMarqueeActive(prev => !prev);
  }, []);

  // Pass onUpdate to all nodes so CanvasNode can call it
  const nodesWithCallbacks = nodes.map(n => ({
    ...n,
    data: { ...n.data, onUpdate: onNodeUpdate },
  }));

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div
      style={{ width: '100vw', height: '100vh', cursor: isMarqueeActive ? 'crosshair' : 'default' }}
    >
      <ReactFlow
        nodes={nodesWithCallbacks}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onMoveEnd={onMoveEnd}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeDragStart={onNodeDragStart}
        onSelectionStart={onSelectionStart}
        onSelectionEnd={onSelectionEnd}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        panOnDrag={!isMarqueeActive}
        selectionOnDrag={isMarqueeActive}
        selectionMode={SelectionMode.Partial}
        elementsSelectable
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
      <CanvasToolbar saveStatus={saveStatus} marqueeActive={isMarqueeActive} onToggleMarquee={toggleMarquee} />
      <BottomDock onCreateNode={handleCreateNodeFromTask} onCreateTask={handleCreateTaskFromNode} />
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
              <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Mind Map Controls</h2>
              <button onClick={() => setShowHelp(false)} className="text-xl leading-none" style={{ color: 'var(--gray-500)' }}>&times;</button>
            </div>
            <div className="space-y-4 text-sm" style={{ color: 'var(--gray-400)' }}>
              <div className="flex gap-3 items-start">
                <span className="px-2 py-1 rounded text-xs font-mono min-w-[60px] text-center" style={{ background: 'var(--gray-800)', color: '#f97316' }}>Toolbar</span>
                <span>Click the + button to add a new node</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="px-2 py-1 rounded text-xs font-mono min-w-[60px] text-center" style={{ background: 'var(--gray-800)', color: '#f97316' }}>Drag</span>
                <span>Pan around the mind map freely</span>
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
              style={{ background: 'var(--primary)', color: 'white' }}
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
            messages={chatMessagesMap[selectedNodeId] || []}
            onMessagesChange={(msgs) => {
              setChatMessagesMap(prev => ({ ...prev, [selectedNodeId!]: msgs }));
              onNodeMessagesUpdate(selectedNodeId!, msgs);
            }}
            onClearChat={() => {
              setChatMessagesMap(prev => ({ ...prev, [selectedNodeId!]: [] }));
              onNodeMessagesUpdate(selectedNodeId!, []);
            }}
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
