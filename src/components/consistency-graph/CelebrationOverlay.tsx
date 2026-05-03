'use client';

import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';

interface CelebrationOverlayProps {
  show: boolean;
  type: 'day' | 'week';
  onComplete: () => void;
}

const PARTICLE_COUNT = 44;

export default function CelebrationOverlay({ show, type, onComplete }: CelebrationOverlayProps) {
  const { resolvedTheme } = useTheme();

  const themeColors = useMemo(() => {
    const map: Record<string, string[]> = {
      zen:      ['#dc2626', '#ef4444', '#f87171', '#facc15'],
      cyberpunk: ['#d946ef', '#a855f7', '#c084fc', '#f472b6'],
      matrix:   ['#008f11', '#16a34a', '#22c55e', '#86efac'],
      sapphire: ['#3b82f6', '#60a5fa', '#93c5fd', '#facc15'],
      emerald:  ['#10b981', '#34d399', '#6ee7b7', '#facc15'],
      sunset:   ['#f59e0b', '#fbbf24', '#fcd34d', '#dc2626'],
      ocean:    ['#06b6d4', '#22d3ee', '#67e8f9', '#facc15'],
      forest:   ['#22c55e', '#4ade80', '#86efac', '#facc15'],
      default:  ['#dc2626', '#f59e0b', '#22c55e', '#ffffff'],
    };
    return map[resolvedTheme || 'default'] ?? map.default;
  }, [resolvedTheme]);

  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      color: themeColors[i % themeColors.length],
      angle: (i / PARTICLE_COUNT) * 360 + Math.random() * 20,
      distance: 120 + Math.random() * 280,
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
      delay: Math.random() * 0.15,
    }));
  }, [themeColors]);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(onComplete, 3200);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
        >
          {/* Screen flash */}
          <motion.div
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-white"
          />

          {/* Expanding glow ring */}
          <motion.div
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute w-32 h-32 rounded-full"
            style={{ backgroundColor: themeColors[0], filter: 'blur(8px)' }}
          />

          {/* Confetti particles */}
          {particles.map(p => (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
              animate={{
                x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
                y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
                opacity: 0,
                scale: 0.3,
                rotate: p.rotation + 720,
              }}
              transition={{ duration: 2, delay: p.delay, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size,
                borderRadius: p.id % 3 === 0 ? '50%' : p.id % 3 === 1 ? '2px' : '0',
                backgroundColor: p.color,
              }}
            />
          ))}

          {/* Badge */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
            style={{ position: 'absolute', textAlign: 'center' }}
          >
            <div className="text-4xl mb-3 select-none" role="img" aria-label={type === 'week' ? 'Trophy' : 'Star'}>
              {type === 'week' ? '🏆' : '🌟'}
            </div>
            <div
              className="px-8 py-4 rounded-2xl font-bold text-xl tracking-wide shadow-[0_0_40px_rgba(255,255,255,0.25)] border"
              style={{
                backgroundColor: 'rgba(10,10,10,0.85)',
                color: themeColors[0],
                borderColor: `${themeColors[0]}66`,
                backdropFilter: 'blur(12px)',
              }}
            >
              {type === 'week' ? 'Perfect Week!' : 'Perfect Day!'}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}