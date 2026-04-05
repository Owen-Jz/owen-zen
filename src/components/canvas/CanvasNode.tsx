// src/components/canvas/CanvasNode.tsx
import { memo, useState, useCallback, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

export interface SubNode {
  id: string;
  content: string;
  color: string;
}

export interface CanvasNodeData {
  content: string;
  description?: string;
  color: string;
  labels: string[];
  childIds?: string[];
  parentId?: string;
  subNodes?: SubNode[];
  isNew?: boolean;
  onUpdate?: (id: string, data: Partial<CanvasNodeData>) => void;
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
  const nodeData = data as unknown as CanvasNodeData;
  const [text, setText] = useState(nodeData.content);
  const [showColors, setShowColors] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const hasSubNodes = (nodeData.subNodes?.length ?? 0) > 0;

  // Auto-focus when a new node is created
  useEffect(() => {
    if (nodeData.isNew) {
      setEditing(true);
      nodeData.onUpdate?.(id, { isNew: undefined });
    }
  }, []);

  const onDoubleClick = useCallback(() => {
    window.dispatchEvent(new CustomEvent('canvas:openNodeModal', { detail: { nodeId: id } }));
  }, [id]);

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
      setText((data as unknown as CanvasNodeData).content);
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

  const onDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData('application/canvas-node', id);
    e.dataTransfer.effectAllowed = 'move';
  }, [id]);

  const onDragEnd = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const onClick = useCallback((e: React.MouseEvent) => {
    if (e.altKey) {
      e.stopPropagation();
      window.dispatchEvent(new CustomEvent('canvas:duplicateNode', {
        detail: {
          id,
          offset: { x: 20, y: 20 },
          data: {
            content: nodeData.content,
            description: nodeData.description,
            color: nodeData.color,
            labels: nodeData.labels,
            subNodes: nodeData.subNodes,
          },
        },
      }));
    }
  }, [id, nodeData]);

  return (
    <div
      className="relative rounded-xl shadow-md min-w-[160px] cursor-grab"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.setData('application/canvas-target', id);
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.stopPropagation();
        setIsDragOver(false);
        const draggedId = e.dataTransfer.getData('application/canvas-node');
        if (draggedId && draggedId !== id) {
          window.dispatchEvent(new CustomEvent('canvas:stackNode', {
            detail: { draggedId, targetId: id },
          }));
        }
      }}
      style={{
        background: 'var(--surface)',
        borderTop: `1px solid ${isDragOver ? nodeData.color : 'var(--border)'}`,
        borderRight: `1px solid ${isDragOver ? nodeData.color : 'var(--border)'}`,
        borderBottom: `1px solid ${isDragOver ? nodeData.color : 'var(--border)'}`,
        borderLeft: `6px solid ${nodeData.color}`,
        boxShadow: selected
          ? `0 0 0 2px var(--primary), 0 2px 8px rgba(0,0,0,0.3)`
          : isDragOver
          ? `0 0 0 2px ${nodeData.color}, 0 2px 8px rgba(0,0,0,0.3)`
          : '0 2px 8px rgba(0,0,0,0.3)',
      }}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      onClick={onClick}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !border-0" style={{ background: 'var(--gray-500)' }} />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !border-0" style={{ background: 'var(--gray-500)' }} />
      <Handle type="source" position={Position.Right} id="right" className="!w-2 !h-2 !border-0" style={{ background: 'var(--gray-500)' }} />
      <Handle type="target" position={Position.Left} id="left" className="!w-2 !h-2 !border-0" style={{ background: 'var(--gray-500)' }} />

      <div className="p-4">
        {editing ? (
          <textarea
            className="w-full bg-transparent outline-none resize-none text-sm"
            style={{ color: 'var(--foreground)' }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            autoFocus
            rows={3}
          />
        ) : (
          <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>
            {nodeData.content || 'Double-click to edit'}
          </p>
        )}
        {hasSubNodes && (
          <div className="mt-3 pt-3 flex flex-col gap-1.5" style={{ borderTop: `1px dashed ${nodeData.color}40` }}>
            {nodeData.subNodes?.map(sub => (
              <div
                key={sub.id}
                className="flex items-center justify-between px-2 py-1.5 rounded-md text-xs"
                style={{ background: `${sub.color}15`, borderLeft: `3px solid ${sub.color}` }}
              >
                <span style={{ color: 'var(--gray-300)' }}>{sub.content || '(empty)'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showColors && (
        <div className="absolute top-full left-0 mt-2 rounded-lg shadow-lg p-2 z-50" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex gap-2">
            {COLOR_MAP.map(({ hex }) => (
              <button
                key={hex}
                className="w-6 h-6 rounded-full border-2 border-transparent hover:border-white/40 transition-colors"
                style={{ backgroundColor: hex }}
                onClick={() => changeColor(hex)}
              />
            ))}
          </div>
          <div className="flex gap-2 mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              className="text-xs px-2 py-1 rounded transition-colors"
              style={{ color: '#f97316' }}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('canvas:addSubNode', { detail: { parentId: id, color: nodeData.color } }));
                setShowColors(false);
              }}
            >
              + Add sub node
            </button>
            <button
              className="text-xs px-2 py-1 rounded transition-colors"
              style={{ color: '#ef4444' }}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('canvas:deleteNode', { detail: id }));
                setShowColors(false);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}