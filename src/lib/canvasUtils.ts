import { Viewport } from '@xyflow/react';

export function addNode(viewport: Viewport) {
  const centerX = (-viewport.x + window.innerWidth / 2) / viewport.zoom;
  const centerY = (-viewport.y + window.innerHeight / 2) / viewport.zoom;

  const newNode = {
    id: crypto.randomUUID(),
    type: 'idea',
    position: { x: centerX - 80, y: centerY - 40 },
    data: { content: '', color: '#f97316', labels: [] },
  };

  // Dispatch custom event for ZCanvas to pick up
  window.dispatchEvent(new CustomEvent('canvas:addNode', { detail: newNode }));
}
