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
  searchQuery?: string;
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

export const CanvasNode = memo(function CanvasNode({ data, selected, id }: NodeProps) {
  const [editing, setEditing] = useState(false);
  const nodeData = data as unknown as CanvasNodeData;
  const searchQuery = nodeData.searchQuery;
  const [text, setText] = useState(nodeData.content);
  const [showColors, setShowColors] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showInlineTagInput, setShowInlineTagInput] = useState(false);
  const [inlineTagInputValue, setInlineTagInputValue] = useState('');
  const [showContextTagInput, setShowContextTagInput] = useState(false);
  const [contextTagInputValue, setContextTagInputValue] = useState('');

  const hasSubNodes = (nodeData.subNodes?.length ?? 0) > 0;
  const isSearchMatch = searchQuery && nodeData.content.toLowerCase().includes(searchQuery.toLowerCase());

  // Run once when isNew transitions to falsy; onUpdate ref is stable from parent
  useEffect(() => {
    if (nodeData.isNew) {
      setEditing(true);
      nodeData.onUpdate?.(id, { isNew: undefined });
    }
  }, [id, nodeData.isNew]); // intentionally omitting nodeData.onUpdate — it is stable

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
    e.stopPropagation();
    setShowColors(true);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    if (!showColors) return;
    const handleClick = () => setShowColors(false);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [showColors]);

  const changeColor = useCallback((hex: string) => {
    nodeData.onUpdate?.(id, { color: hex });
    setShowColors(false);
  }, [id, nodeData]);

  const addTag = useCallback((tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || nodeData.labels.includes(trimmed)) return;
    nodeData.onUpdate?.(id, { labels: [...nodeData.labels, trimmed] });
  }, [id, nodeData]);

  const removeTag = useCallback((tag: string) => {
    nodeData.onUpdate?.(id, { labels: nodeData.labels.filter(l => l !== tag) });
  }, [id, nodeData]);

  const onInlineTagKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addTag(inlineTagInputValue);
      setInlineTagInputValue('');
      setShowInlineTagInput(false);
    }
    if (e.key === 'Escape') {
      setInlineTagInputValue('');
      setShowInlineTagInput(false);
    }
  }, [addTag, inlineTagInputValue]);

  const onContextTagKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addTag(contextTagInputValue);
      setContextTagInputValue('');
      setShowContextTagInput(false);
    }
    if (e.key === 'Escape') {
      setContextTagInputValue('');
      setShowContextTagInput(false);
    }
  }, [addTag, contextTagInputValue]);

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
          : isSearchMatch
          ? `0 0 0 2px ${nodeData.color}80, 0 2px 8px rgba(0,0,0,0.3)`
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

        {/* Inline tags */}
        {(nodeData.labels.length > 0 || showInlineTagInput) && (
          <div className="mt-2 flex flex-wrap gap-1.5 items-center">
            {nodeData.labels.map(label => (
              <span
                key={label}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                style={{
                  background: `${nodeData.color}20`,
                  border: `1px solid ${nodeData.color}60`,
                  color: nodeData.color,
                }}
              >
                {label}
                <button
                  className="ml-0.5 hover:opacity-80 leading-none"
                  onClick={(e) => { e.stopPropagation(); removeTag(label); }}
                >
                  ×
                </button>
              </span>
            ))}
            {showInlineTagInput ? (
              <input
                className="inline-block w-20 px-1.5 py-0.5 rounded-full text-xs bg-transparent outline-none"
                style={{
                  border: `1px solid ${nodeData.color}60`,
                  color: 'var(--foreground)',
                }}
                value={inlineTagInputValue}
                onChange={(e) => setInlineTagInputValue(e.target.value)}
                onKeyDown={onInlineTagKeyDown}
                onBlur={() => { setInlineTagInputValue(''); setShowInlineTagInput(false); }}
                autoFocus
              />
            ) : (
              <button
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs hover:opacity-80 transition-opacity"
                style={{ color: `${nodeData.color}80` }}
                onClick={(e) => { e.stopPropagation(); setShowInlineTagInput(true); }}
              >
                +tag
              </button>
            )}
          </div>
        )}

        {/* "+tag" button always visible when no labels and no input */}
        {nodeData.labels.length === 0 && !showInlineTagInput && (
          <button
            className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs hover:opacity-80 transition-opacity"
            style={{ color: `${nodeData.color}80` }}
            onClick={(e) => { e.stopPropagation(); setShowInlineTagInput(true); }}
          >
            +tag
          </button>
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
        <div
          className="absolute top-full left-0 mt-2 w-52 rounded-xl shadow-2xl z-[200] overflow-hidden"
          style={{
            background: 'rgba(15, 15, 20, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Color section */}
          <div className="p-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[10px] uppercase font-bold tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Color</p>
            <div className="flex gap-2">
              {COLOR_MAP.map(({ hex }) => (
                <button
                  key={hex}
                  className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: hex,
                    borderColor: nodeData.color === hex ? 'white' : 'transparent',
                    boxShadow: nodeData.color === hex ? `0 0 0 2px rgba(255,255,255,0.3)` : 'none',
                  }}
                  onClick={() => changeColor(hex)}
                />
              ))}
            </div>
          </div>

          {/* Tags section */}
          <div className="p-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[10px] uppercase font-bold tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Tags</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {nodeData.labels.map(label => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                  style={{
                    background: `${nodeData.color}20`,
                    border: `1px solid ${nodeData.color}60`,
                    color: nodeData.color,
                  }}
                >
                  {label}
                  <button
                    className="ml-0.5 hover:opacity-80 leading-none"
                    onClick={(e) => { e.stopPropagation(); removeTag(label); }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            {showContextTagInput ? (
              <input
                className="w-full px-2 py-1 rounded text-xs bg-transparent outline-none"
                style={{
                  border: `1px solid ${nodeData.color}60`,
                  color: 'var(--foreground)',
                }}
                value={contextTagInputValue}
                onChange={(e) => setContextTagInputValue(e.target.value)}
                onKeyDown={onContextTagKeyDown}
                onBlur={() => { setContextTagInputValue(''); setShowContextTagInput(false); }}
                autoFocus
                placeholder="Tag name — Enter to add"
              />
            ) : (
              <button
                className="text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
                style={{ color: `${nodeData.color}80` }}
                onClick={(e) => { e.stopPropagation(); setShowContextTagInput(true); }}
              >
                + Add tag
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="p-1.5">
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors hover:bg-white/10"
              style={{ color: 'rgba(255,255,255,0.7)' }}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('canvas:addSubNode', { detail: { parentId: id, color: nodeData.color } }));
                setShowColors(false);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add sub node
            </button>

            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors hover:bg-white/10"
              style={{ color: 'rgba(255,255,255,0.7)' }}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('canvas:moveNodeToTaskBoard', {
                  detail: {
                    id,
                    data: {
                      content: nodeData.content,
                      description: nodeData.description,
                      color: nodeData.color,
                      subNodes: nodeData.subNodes,
                    },
                  },
                }));
                setShowColors(false);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
              Move to Task Board
            </button>

            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors"
              style={{ color: 'rgba(239, 68, 68, 0.8)' }}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('canvas:deleteNode', { detail: id }));
                setShowColors(false);
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
              </svg>
              Delete node
            </button>
          </div>
        </div>
      )}
    </div>
  );
});