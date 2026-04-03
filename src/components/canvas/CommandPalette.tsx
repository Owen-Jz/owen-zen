'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Node } from '@xyflow/react';

interface CommandPaletteProps {
  nodes: Node[];
  onCreateNode: (content: string) => void;
  onClose: () => void;
}

export function CommandPalette({ nodes, onCreateNode, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = nodes.filter(n =>
    (n.data.content as string).toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex === filtered.length && query.trim()) {
        onCreateNode(query.trim());
      }
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [filtered.length, selectedIndex, query, onCreateNode, onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
        onClick={onClose}
      >
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
          <div className="p-3 border-b border-slate-100 dark:border-slate-700">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search ideas or create new..."
              className="w-full bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
              onKeyDown={handleKeyDown}
            />
          </div>
          <ul className="max-h-64 overflow-y-auto p-2">
            {filtered.slice(0, 5).map((node, i) => (
              <li
                key={node.id}
                className={`px-3 py-2 rounded-lg cursor-pointer text-sm ${i === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-slate-700 dark:text-slate-300'}`}
                onClick={() => onClose()}
              >
                {(node.data.content as string) || '(empty)'}
              </li>
            ))}
            {query.trim() && (
              <li
                className={`px-3 py-2 rounded-lg cursor-pointer text-sm mt-1 ${selectedIndex === filtered.length ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-slate-700 dark:text-slate-300'}`}
                onClick={() => { onCreateNode(query.trim()); onClose(); }}
              >
                + Create "{query}"
              </li>
            )}
          </ul>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
