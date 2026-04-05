// src/components/canvas/NodeModal.tsx
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CanvasNodeData } from './CanvasNode';
import { AIChatPanel } from './AIChatPanel';

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

interface NodeModalProps {
  nodeId: string;
  data: CanvasNodeData;
  childNodes: { id: string; content: string; color: string }[];
  messages: { role: 'user' | 'assistant'; content: string }[];
  onMessagesChange: (msgs: { role: 'user' | 'assistant'; content: string }[]) => void;
  onClearChat: () => void;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<CanvasNodeData>) => void;
  onDelete: (id: string) => void;
  onAddSubNode: (parentId: string, color: string, content?: string) => void;
  onDeleteSubNode: (parentId: string, subNodeId: string) => void;
  onUpdateSubNode: (parentId: string, subNodeId: string, content: string) => void;
}

export function NodeModal({ nodeId, data, childNodes, messages, onMessagesChange, onClearChat, onClose, onUpdate, onDelete, onAddSubNode, onDeleteSubNode, onUpdateSubNode }: NodeModalProps) {
  const [content, setContent] = useState(data.content);
  const [description, setDescription] = useState(data.description || '');
  const [subContent, setSubContent] = useState('');
  const [editingSubNodeId, setEditingSubNodeId] = useState<string | null>(null);
  const [editingSubNodeText, setEditingSubNodeText] = useState('');

  useEffect(() => {
    setContent(data.content);
    setDescription(data.description || '');
  }, [data.content, data.description]);

  const handleSave = useCallback(() => {
    onUpdate(nodeId, { content, description });
  }, [nodeId, content, description, onUpdate]);

  const addSubNode = useCallback(() => {
    if (subContent.trim()) {
      onAddSubNode(nodeId, data.color, subContent.trim());
    } else {
      onAddSubNode(nodeId, data.color);
    }
    setSubContent('');
  }, [subContent, data.color, nodeId, onAddSubNode]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        onClick={handleSave}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>Edit Node</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { onDelete(nodeId); onClose(); }}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--color-error)', background: 'color-mix(in srgb, var(--color-error) 12%, transparent)' }}
              >
                Delete node
              </button>
              <button
                onClick={onClose}
                className="text-xl leading-none"
                style={{ color: 'var(--gray-500)' }}
              >
                &times;
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Left column — existing editor */}
            <div className="flex-1 px-6 py-5 space-y-5 overflow-y-auto min-h-0">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--gray-400)' }}>Title</label>
                <textarea
                  className="w-full rounded-lg p-3 text-sm resize-none outline-none"
                  style={{
                    background: 'var(--gray-800)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                  }}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  onBlur={handleSave}
                  rows={2}
                  placeholder="Node title..."
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--gray-400)' }}>Description</label>
                <textarea
                  className="w-full rounded-lg p-3 text-sm resize-none outline-none"
                  style={{
                    background: 'var(--gray-800)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                  }}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  onBlur={handleSave}
                  rows={6}
                  placeholder="Add more details..."
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--gray-400)' }}>Color</label>
                <div className="flex gap-2">
                  {COLOR_MAP.map(({ hex, name }) => (
                    <button
                      key={hex}
                      title={name}
                      className="w-7 h-7 rounded-full transition-all"
                      style={{
                        backgroundColor: hex,
                        outline: data.color === hex ? `2px solid ${hex}` : 'none',
                        outlineOffset: '2px',
                        transform: data.color === hex ? 'scale(1.15)' : 'scale(1)',
                      }}
                      onClick={() => onUpdate(nodeId, { color: hex })}
                    />
                  ))}
                </div>
              </div>

              {/* Sub nodes */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--gray-400)' }}>
                  Sub nodes ({childNodes.length})
                </label>
                <div className="space-y-2 mb-3">
                  {childNodes.length === 0 && (
                    <p className="text-xs py-2" style={{ color: 'var(--gray-600)' }}>No sub nodes yet</p>
                  )}
                  {childNodes.map(child => (
                    <div key={child.id} className="space-y-1">
                      {editingSubNodeId === child.id ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--gray-800)', borderLeft: `3px solid ${child.color}` }}>
                          <input
                            type="text"
                            className="flex-1 bg-transparent outline-none text-sm px-1"
                            style={{ color: 'var(--foreground)' }}
                            value={editingSubNodeText}
                            onChange={e => setEditingSubNodeText(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') { e.preventDefault(); onUpdateSubNode(nodeId, child.id, editingSubNodeText); setEditingSubNodeId(null); }
                              if (e.key === 'Escape') { setEditingSubNodeId(null); }
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => { onUpdateSubNode(nodeId, child.id, editingSubNodeText); setEditingSubNodeId(null); }}
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ color: 'var(--color-success)' }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingSubNodeId(null)}
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ color: 'var(--color-error)' }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div
                          className="flex items-center justify-between px-3 py-2 rounded-lg text-sm group cursor-pointer"
                          style={{ background: 'var(--gray-800)', borderLeft: `3px solid ${child.color}` }}
                          onClick={() => { setEditingSubNodeId(child.id); setEditingSubNodeText(child.content); }}
                        >
                          <span style={{ color: 'var(--foreground)' }}>{child.content || '(empty)'}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteSubNode(nodeId, child.id); }}
                            className="text-xs px-1.5 py-0.5 rounded transition-colors hover:bg-red-500/20 opacity-0 group-hover:opacity-100"
                            style={{ color: 'var(--color-error)' }}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                    style={{
                      background: 'var(--gray-800)',
                      color: 'var(--foreground)',
                      border: '1px solid var(--border)',
                    }}
                    value={subContent}
                    onChange={e => setSubContent(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); addSubNode(); }
                    }}
                    placeholder="Add a sub node..."
                  />
                  <button
                    onClick={addSubNode}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                    style={{ background: data.color }}
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px" style={{ background: 'var(--border)' }} />

            {/* Right column — AI Chat */}
            <div className="flex-1 min-h-0 flex flex-col">
              <AIChatPanel
                nodeId={nodeId}
                nodeData={data}
                messages={messages}
                onMessagesChange={onMessagesChange}
                onClearChat={onClearChat}
                onUpdate={onUpdate}
                onAddSubNode={onAddSubNode}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{ background: 'var(--gray-800)', color: 'var(--foreground)' }}
            >
              Done
            </button>
            <button
              onClick={() => { handleSave(); onClose(); }}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
              style={{ background: 'var(--primary)' }}
            >
              Save changes
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}