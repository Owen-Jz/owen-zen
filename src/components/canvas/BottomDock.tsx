// src/components/canvas/BottomDock.tsx
'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GripVertical, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import { Task } from '@/types';

interface BottomDockProps {
  onCreateNode: (task: Task, position: { x: number; y: number }) => void;
  onCreateTask: (nodeId: string, position: { x: number; y: number }) => void;
}

interface DockTask extends Task {
  _id: string;
  title: string;
  subtasks?: { title: string; completed: boolean }[];
}

export default function BottomDock({ onCreateNode, onCreateTask }: BottomDockProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const { data } = useQuery<{ success: boolean; data: DockTask[] }>({
    queryKey: ['dock-tasks'],
    queryFn: () => fetch('/api/tasks?status=mind-map').then(r => r.json()),
  });

  const dockTasks = data?.data ?? [];

  const handleTaskDragStart = useCallback((e: React.DragEvent, task: DockTask) => {
    e.dataTransfer.setData('application/zen-dock-task', JSON.stringify(task));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTaskId(task._id);
    sessionStorage.setItem('dock-drag-task', JSON.stringify(task));
  }, []);

  const handleTaskDragEnd = useCallback((e: React.DragEvent) => {
    setDraggingTaskId(null);
    sessionStorage.removeItem('dock-drag-task');
  }, []);

  const handleNodeDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const nodeId = e.dataTransfer.getData('application/canvas-node');
    if (!nodeId) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const position = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    onCreateTask(nodeId, position);
  }, [onCreateTask]);

  const handleNodeDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const hasNode = e.dataTransfer.types.includes('application/canvas-node');
    if (hasNode) {
      setIsDragOver(true);
      e.dataTransfer.dropEffect = 'move';
    }
  }, []);

  const handleNodeDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 flex flex-col items-center transition-all duration-300"
      style={{ pointerEvents: 'none' }}
    >
      {/* Header bar — always clickable */}
      <div
        className="w-full max-w-3xl flex items-center justify-between px-4 py-2 rounded-t-2xl border-t border-l border-r backdrop-blur-md shadow-2xl transition-all duration-300"
        style={{
          background: 'var(--surface)',
          borderColor: isDragOver ? 'var(--color-error)' : 'var(--border)',
          pointerEvents: 'auto',
        }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: 'var(--primary)' }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--gray-400)' }}>
            Mind Map Stage
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
            style={{ background: 'var(--gray-800)', color: 'var(--gray-400)' }}
          >
            {dockTasks.length}
          </span>
        </div>
        <button
          onClick={() => setCollapsed(c => !c)}
          className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: 'var(--gray-500)' }}
          aria-label={collapsed ? 'Expand dock' : 'Collapse dock'}
        >
          {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded dock body */}
      {!collapsed && (
        <div
          className="w-full max-w-3xl flex items-center gap-3 px-4 py-3 rounded-t-none border-l border-r border-b backdrop-blur-md shadow-2xl overflow-x-auto scrollbar-hide"
          style={{
            background: 'var(--surface)',
            borderColor: isDragOver ? 'var(--color-error)' : 'var(--border)',
            minHeight: 80,
            pointerEvents: 'auto',
          }}
          onDrop={handleNodeDrop}
          onDragOver={handleNodeDragOver}
          onDragLeave={handleNodeDragLeave}
        >
          {dockTasks.length === 0 ? (
            <div
              className="flex items-center justify-center w-full text-sm italic"
              style={{ color: 'var(--gray-600)' }}
            >
              Drag tasks here to stage them for the mind map — or drop canvas nodes here to convert to tasks
            </div>
          ) : (
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-1">
              {dockTasks.map(task => (
                <div
                  key={task._id}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border cursor-grab shrink-0 transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: 'var(--gray-900)',
                    borderColor: draggingTaskId === task._id ? 'var(--primary)' : 'var(--border)',
                    boxShadow: draggingTaskId === task._id ? '0 0 0 2px var(--primary)' : 'none',
                  }}
                  draggable
                  onDragStart={e => handleTaskDragStart(e, task)}
                  onDragEnd={handleTaskDragEnd}
                >
                  <GripVertical size={12} style={{ color: 'var(--gray-600)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    {task.title}
                  </span>
                  {task.subtasks && task.subtasks.length > 0 && (
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                      style={{ background: 'var(--primary)', color: 'white' }}
                    >
                      {task.subtasks.length}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
