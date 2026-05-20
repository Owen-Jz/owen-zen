"use client";

import { motion } from "framer-motion";
import { SkeletonLoader, SkeletonGroup } from "./motion/SkeletonLoader";

export const Loading = ({ text = "Loading...", skeleton = false }: { text?: string; skeleton?: boolean }) => {
  if (skeleton) {
    return (
      <div className="flex flex-col items-center justify-center p-8 w-full h-full min-h-[300px] space-y-6">
        <SkeletonGroup count={3} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-6 w-full h-full min-h-[300px]">
      <div className="relative w-16 h-16">
        {/* Outer Ring */}
        <motion.div
          className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        {/* Inner Pulse */}
        <motion.div
          className="absolute inset-3 bg-primary/20 rounded-full blur-md"
          animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Center Dot */}
        <div className="absolute inset-[26px] bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.8)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col items-center gap-1"
      >
        <span className="text-sm font-bold text-gray-300 tracking-[0.2em] uppercase">{text}</span>
        <span className="text-[10px] text-gray-500">Stay Focused</span>
      </motion.div>
    </div>
  );
};

// View skeleton with shimmer loading state
export const LoadingSkeleton = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex flex-col gap-4 p-4 ${className}`}>
      <div className="flex items-center gap-4">
        <SkeletonLoader variant="circle" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <SkeletonLoader variant="text" width="40%" height={20} />
          <SkeletonLoader variant="text" width="60%" height={14} />
        </div>
      </div>
      <SkeletonLoader variant="rectangle" height={120} />
      <div className="space-y-2">
        <SkeletonLoader variant="text" lines={2} />
      </div>
    </div>
  );
};