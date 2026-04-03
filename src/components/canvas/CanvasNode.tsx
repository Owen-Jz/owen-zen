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
