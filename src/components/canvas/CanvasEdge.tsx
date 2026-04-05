// src/components/canvas/CanvasEdge.tsx
import { memo, useCallback } from 'react';
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
          <path d="M 2 0 L 12 6 L 2 12 z" fill="var(--gray-500)" />
        </marker>
      </defs>
      {label && (
        <EdgeLabelRenderer>
          <div
            className="absolute px-2 py-1 rounded text-xs font-medium pointer-events-all"
            style={{
              background: 'var(--surface)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
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
