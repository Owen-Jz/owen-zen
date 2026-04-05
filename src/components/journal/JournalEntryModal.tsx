// src/components/journal/JournalEntryModal.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface Entry {
  _id?: string;
  date: string;
  text: string;
  mood: number;
  tags: string[];
  updatedAt?: string;
}

interface JournalEntryModalProps {
  date: string; // "2026-04-05"
  entry: Entry | null;
  onClose: () => void;
  onSave: (data: { text: string; mood: number; tags: string[] }) => void;
}

const MOOD_COLORS = ['#c0392b', '#e74c3c', '#f39c12', '#2ecc71', '#27ae60'];
const MOOD_LABELS = ['Terrible', 'Bad', 'Okay', 'Good', 'Great'];

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export function JournalEntryModal({ date, entry, onClose, onSave }: JournalEntryModalProps) {
  const [text, setText] = useState(entry?.text ?? '');
  const [mood, setMood] = useState(entry?.mood ?? 3);
  const [tags, setTags] = useState<string[]>(entry?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync when entry changes
  useEffect(() => {
    setText(entry?.text ?? '');
    setMood(entry?.mood ?? 3);
    setTags(entry?.tags ?? []);
    setLastSaved(entry?.updatedAt ? new Date(entry.updatedAt).toLocaleTimeString() : null);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [entry]);

  const save = useCallback((data: { text: string; mood: number; tags: string[] }) => {
    setIsSaving(true);
    Promise.resolve(onSave(data)).finally(() => {
      setIsSaving(false);
      setLastSaved(new Date().toLocaleTimeString());
    });
  }, [onSave]);

  // Debounced auto-save on text change
  useEffect(() => {
    if (!entry && text === '' && mood === 3 && tags.length === 0) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      save({ text, mood, tags });
    }, 1000);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [text, mood, tags, save, entry]);

  // Immediate save on mood change
  const handleMoodClick = useCallback((m: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setMood(m);
    save({ text, mood: m, tags });
  }, [text, tags, save]);

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      const newTags = [...tags, trimmed];
      setTags(newTags);
      setTagInput('');
      save({ text, mood, tags: newTags });
    }
  };

  const handleRemoveTag = (tag: string) => {
    const newTags = tags.filter(t => t !== tag);
    setTags(newTags);
    save({ text, mood, tags: newTags });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-white">{formatDisplayDate(date)}</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Mood selector */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm text-gray-400">Mood:</span>
              <div className="flex gap-2">
                {MOOD_COLORS.map((color, i) => (
                  <button
                    key={i}
                    onClick={() => handleMoodClick(i + 1)}
                    className={cn(
                      "w-7 h-7 rounded-full transition-all hover:scale-110",
                      mood === i + 1 && "ring-2 ring-white ring-offset-2 ring-offset-gray-900"
                    )}
                    style={{ backgroundColor: color }}
                    title={MOOD_LABELS[i]}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-300 ml-1">{MOOD_LABELS[mood - 1] ?? 'Unknown'}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full flex items-center gap-1"
                >
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="hover:text-white">
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleAddTag}
                placeholder="+ Add tag"
                className="bg-transparent text-xs text-gray-400 placeholder:text-gray-600 outline-none w-20"
              />
            </div>
          </div>

          {/* Text area */}
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write your thoughts for today..."
            className="w-full h-48 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-gray-600 resize-none outline-none focus:border-primary/50 transition-colors"
          />

          {/* Footer */}
          <div className="flex justify-end items-center mt-3">
            {isSaving ? (
              <span className="text-xs text-gray-500">Saving...</span>
            ) : lastSaved ? (
              <span className="text-xs text-gray-500">Last saved: {lastSaved}</span>
            ) : (
              <span className="text-xs text-gray-500">Auto-saves as you type</span>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
