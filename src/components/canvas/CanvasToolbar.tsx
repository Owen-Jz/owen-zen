'use client';

import { useState, useEffect, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { addNode } from '@/lib/canvasUtils';

interface CanvasToolbarProps {
  saveStatus?: 'idle' | 'saving' | 'saved';
}

export function CanvasToolbar({ saveStatus }: CanvasToolbarProps) {
  const [visible, setVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const { fitView, getViewport } = useReactFlow();

  useEffect(() => {
    const handleMouseMove = () => {
      if (!isHovered) setVisible(true);
    };
    const timeout = setTimeout(() => {
      if (!isHovered) setVisible(false);
    }, 3000);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isHovered]);

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              background: 'rgba(10, 10, 10, 0.9)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--border)',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <button
              onClick={() => addNode(getViewport())}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-sm font-medium transition-colors"
              style={{ background: 'var(--primary)' }}
            >
              <span>+</span> Add Node
            </button>
            <button
              onClick={() => fitView({ padding: 0.2 })}
              className="px-3 py-1.5 rounded-full text-sm transition-colors"
              style={{ color: 'var(--gray-400)' }}
            >
              Fit View
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
