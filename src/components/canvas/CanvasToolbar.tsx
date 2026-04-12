'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { addNode } from '@/lib/canvasUtils';

interface CanvasToolbarProps {
  saveStatus?: 'idle' | 'saving' | 'saved';
  marqueeActive?: boolean;
  onToggleMarquee?: () => void;
  onSearchChange?: (query: string) => void;
  onSearchClose?: () => void;
}

export function CanvasToolbar({ saveStatus, marqueeActive, onToggleMarquee, onSearchChange, onSearchClose }: CanvasToolbarProps) {
  const [visible, setVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { fitView, getViewport } = useReactFlow();
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
    setSearchQuery('');
    onSearchChange?.('');
  }, [onSearchChange]);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
    onSearchClose?.();
  }, [onSearchClose]);

  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    onSearchChange?.(val);
  }, [onSearchChange]);

  // Auto-focus search input when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Escape key to close search
  useEffect(() => {
    if (!isSearchOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, closeSearch]);

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
            {isSearchOpen ? (
              <>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  placeholder="Search all nodes..."
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-sm font-medium bg-transparent outline-none w-64"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}
                />
                <button
                  onClick={closeSearch}
                  className="px-2 py-1.5 rounded-full text-sm transition-colors"
                  style={{ color: 'var(--gray-400)' }}
                >
                  ✕
                </button>
              </>
            ) : (
              <>
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
                <button
                  onClick={onToggleMarquee}
                  className="px-3 py-1.5 rounded-full text-sm transition-colors"
                  style={{
                    background: marqueeActive ? 'var(--primary)' : 'transparent',
                    color: marqueeActive ? 'white' : 'var(--gray-400)',
                    border: `1px solid ${marqueeActive ? 'var(--primary)' : 'var(--border)'}`,
                  }}
                >
                  Marquee
                </button>
                <button
                  onClick={openSearch}
                  className="px-3 py-1.5 rounded-full text-sm transition-colors"
                  style={{ color: 'var(--gray-400)' }}
                >
                  🔍
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
