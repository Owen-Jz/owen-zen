"use client";

import { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { VERSES } from "@/data/verses";

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export const DailyWordWidget = () => {
  const [verse, setVerse] = useState(VERSES[0]);

  useEffect(() => {
    setVerse(VERSES[getDayOfYear() % VERSES.length]);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-border rounded-2xl p-6 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="flex items-center gap-3 mb-4 text-primary">
        <BookOpen size={18} />
        <span className="text-xs font-bold uppercase tracking-[0.2em]">Daily Word</span>
      </div>

      <blockquote className="text-lg font-serif italic text-gray-200 mb-4 leading-tight">
        "{verse.text}"
      </blockquote>

      <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
        <div className="w-6 h-[1px] bg-primary" />
        {verse.ref}
      </div>
    </motion.div>
  );
};
