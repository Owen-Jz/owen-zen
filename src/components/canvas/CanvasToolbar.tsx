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
  const [isDark, setIsDark] = useState(false);
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

  const toggleDark = useCallback(() => {
    setIsDark(prev => {
      document.documentElement.classList.toggle('dark', !prev);
      return !prev;
    });
  }, []);

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200/50"
            style={{
              background: isDark ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(12px)',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <button
              onClick={() => addNode(getViewport())}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              <span>+</span> Add Node
            </button>
            <button
              onClick={() => fitView({ padding: 0.2 })}
              className="px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm transition-colors"
            >
              Fit View
            </button>
            <button
              onClick={toggleDark}
              className="px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm transition-colors"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
