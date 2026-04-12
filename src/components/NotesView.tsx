"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, X, FileText, Star, Archive, Trash2,
  Bold, Italic, List, ListOrdered, Loader2, WifiOff,
  Check, AlertCircle, ChevronDown, Edit2, Save
} from "lucide-react";
import { Note } from "@/types";

// ── Constants ─────────────────────────────────────────────────────────────────────
const MAX_CONTENT_LENGTH = 5000;
const DEBOUNCE_DELAY = 2000;
const STORAGE_KEY = "owen-zen-notes-offline";

// ── Types ───────────────────────────────────────────────────────────────────────
interface NoteFormData {
  title: string;
  content: string;
}

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

// ── Utility Functions ──────────────────────────────────────────────────────────
function sanitizeInput(input: string): string {
  // Basic XSS prevention - remove script tags and event handlers
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "");
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
  });
}

function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(" ");
}

// ── Debounce Hook ───────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ── Local Storage Hook ─────────────────────────────────────────────────────────
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

// ── Confirmation Dialog ─────────────────────────────────────────────────────────
function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel
}: ConfirmDialogState & { onCancel: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
          style={{ background: 'var(--surface)' }}
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
              <p className="text-gray-400 text-sm">{message}</p>
            </div>
            <div className="flex gap-3 p-4 border-t border-white/5">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Rich Text Editor ───────────────────────────────────────────────────────────
function RichTextEditor({
  value,
  onChange,
  disabled,
  maxLength
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  maxLength: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormat = (format: "bold" | "italic" | "list" | "orderedList") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let newText = "";
    let newCursorPos = start;

    switch (format) {
      case "bold":
        newText = value.substring(0, start) + `**${selectedText}**` + value.substring(end);
        newCursorPos = start + 2 + selectedText.length + 2;
        break;
      case "italic":
        newText = value.substring(0, start) + `*${selectedText}*` + value.substring(end);
        newCursorPos = start + 1 + selectedText.length + 1;
        break;
      case "list":
        newText = value.substring(0, start) + `\n- ${selectedText}` + value.substring(end);
        newCursorPos = start + 3 + selectedText.length;
        break;
      case "orderedList":
        newText = value.substring(0, start) + `\n1. ${selectedText}` + value.substring(end);
        newCursorPos = start + 4 + selectedText.length;
        break;
    }

    onChange(newText);

    // Restore cursor position after React renders
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className="relative flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-white/5 bg-white/[0.02]">
        <button
          type="button"
          onClick={() => applyFormat("bold")}
          disabled={disabled}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
          title="Bold (Ctrl+B)"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => applyFormat("italic")}
          disabled={disabled}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
          title="Italic (Ctrl+I)"
        >
          <Italic size={16} />
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button
          type="button"
          onClick={() => applyFormat("list")}
          disabled={disabled}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => applyFormat("orderedList")}
          disabled={disabled}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        disabled={disabled}
        placeholder="Start writing your note..."
        className="flex-1 w-full p-4 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none font-mono text-sm leading-relaxed"
        maxLength={maxLength}
      />

      {/* Character Count */}
      <div className="absolute bottom-2 right-2 text-xs text-gray-500">
        {value.length} / {maxLength}
      </div>
    </div>
  );
}

// ── Note Card Component ───────────────────────────────────────────────────────
function NoteCard({
  note,
  isSelected,
  onSelect,
  onPin,
  onArchive,
  onDelete
}: {
  note: Note;
  isSelected: boolean;
  onSelect: () => void;
  onPin: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={onSelect}
      className={cn(
        "group relative p-4 rounded-xl border cursor-pointer transition-all",
        isSelected
          ? "bg-primary/10 border-primary/30"
          : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
      )}
    >
      {/* Pinned indicator */}
      {note.isPinned && (
        <div className="absolute top-2 right-2">
          <Star size={14} className="text-yellow-500 fill-yellow-500" />
        </div>
      )}

      {/* Title */}
      <h3 className="font-medium text-white mb-1 pr-6 truncate">
        {note.title || "Untitled Note"}
      </h3>

      {/* Preview */}
      <p className="text-sm text-gray-400 line-clamp-2 mb-2">
        {note.content?.slice(0, 100) || "No content"}
      </p>

      {/* Meta */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{formatDate(note.updatedAt)}</span>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
          >
            <ChevronDown size={14} />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-full mt-1 border border-white/10 rounded-lg shadow-xl overflow-hidden z-10"
                style={{ background: 'var(--surface)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => { onPin(); setShowMenu(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
                >
                  <Star size={14} />
                  {note.isPinned ? "Unpin" : "Pin"}
                </button>
                <button
                  onClick={() => { onArchive(); setShowMenu(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
                >
                  <Archive size={14} />
                  {note.isArchived ? "Unarchive" : "Archive"}
                </button>
                <button
                  onClick={() => { setShowMenu(false); onDelete(); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main NotesView Component ───────────────────────────────────────────────────
export default function NotesView() {
  // State
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState<NoteFormData>({ title: "", content: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [filter, setFilter] = useState<"all" | "pinned" | "archived">("all");
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  // Refs
  const userIdRef = useRef<string>("default-user");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef<{ title: string; content: string } | null>(null);

  // Debounced values
  const debouncedContent = useDebounce(formData.content, DEBOUNCE_DELAY);
  const debouncedTitle = useDebounce(formData.title, DEBOUNCE_DELAY);

  // Local storage for offline
  const [offlineNotes, setOfflineNotes] = useLocalStorage<Note[]>(STORAGE_KEY, []);

  // Filter notes based on search and filter
  const filteredNotes = useMemo(() => {
    let result = notes;

    // Apply filter
    if (filter === "pinned") {
      result = result.filter(n => n.isPinned);
    } else if (filter === "archived") {
      result = result.filter(n => n.isArchived);
    } else {
      result = result.filter(n => !n.isArchived);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        n =>
          n.title?.toLowerCase().includes(query) ||
          n.content?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [notes, filter, searchQuery]);

  // Fetch notes
  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("userId", userIdRef.current);
      if (filter === "archived") {
        params.set("archived", "true");
      }

      const response = await fetch(`/api/notes?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch notes");
      }

      const data = await response.json();

      if (data.success) {
        setNotes(data.data);
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
      setError("Failed to load notes");
      // Fallback to local storage
      setNotes(offlineNotes);
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  }, [filter, offlineNotes]);

  // Save note to API
  const saveNote = useCallback(async (note: Note) => {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/notes/${note._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userIdRef.current,
          title: sanitizeInput(note.title),
          content: sanitizeInput(note.content),
          isPinned: note.isPinned,
          isArchived: note.isArchived
        })
      });

      if (!response.ok) {
        throw new Error("Failed to save note");
      }

      const data = await response.json();

      if (data.success) {
        setNotes(prev => prev.map(n => n._id === note._id ? data.data : n));
        // Update offline storage
        setOfflineNotes(prev => prev.map(n => n._id === note._id ? data.data : n));
        setIsOffline(false);
      }
    } catch (err) {
      console.error("Error saving note:", err);
      // Save to local storage for offline
      setOfflineNotes(prev => {
        const existing = prev.find(n => n._id === note._id);
        if (existing) {
          return prev.map(n => n._id === note._id ? note : n);
        }
        return [...prev, note];
      });
      setIsOffline(true);
    } finally {
      setIsSaving(false);
    }
  }, [setOfflineNotes]);

  // Create new note
  const createNote = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userIdRef.current,
          title: "Untitled Note",
          content: ""
        })
      });

      if (!response.ok) {
        throw new Error("Failed to create note");
      }

      const data = await response.json();

      if (data.success) {
        setNotes(prev => [data.data, ...prev]);
        setSelectedNote(data.data);
        setFormData({ title: data.data.title, content: data.data.content });
      }
    } catch (err) {
      console.error("Error creating note:", err);
      setError("Failed to create note");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete note
  const deleteNote = useCallback(async (noteId: string) => {
    try {
      const response = await fetch(`/api/notes/${noteId}?userId=${userIdRef.current}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Failed to delete note");
      }

      setNotes(prev => prev.filter(n => n._id !== noteId));
      setOfflineNotes(prev => prev.filter(n => n._id !== noteId));

      if (selectedNote?._id === noteId) {
        setSelectedNote(null);
        setFormData({ title: "", content: "" });
      }
    } catch (err) {
      console.error("Error deleting note:", err);
      setError("Failed to delete note");
    }
  }, [selectedNote, setOfflineNotes]);

  // Toggle pin
  const togglePin = useCallback(async (note: Note) => {
    const updatedNote = { ...note, isPinned: !note.isPinned };
    setNotes(prev => prev.map(n => n._id === note._id ? updatedNote : n));

    if (selectedNote?._id === note._id) {
      setSelectedNote(updatedNote);
    }

    await saveNote(updatedNote);
  }, [selectedNote, saveNote]);

  // Toggle archive
  const toggleArchive = useCallback(async (note: Note) => {
    const updatedNote = { ...note, isArchived: !note.isArchived };
    setNotes(prev => prev.map(n => n._id === note._id ? updatedNote : n));

    if (selectedNote?._id === note._id) {
      setSelectedNote(null);
      setFormData({ title: "", content: "" });
    }

    await saveNote(updatedNote);
  }, [selectedNote, saveNote]);

  // Open delete confirmation
  const openDeleteConfirm = useCallback((note: Note) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Note",
      message: `Are you sure you want to delete "${note.title}"? This action cannot be undone.`,
      onConfirm: () => {
        deleteNote(note._id);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, [deleteNote]);

  // Load notes on mount
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Track what's actually saved to avoid unnecessary saves
  const lastSavedRef = useRef<{ title: string; content: string } | null>(null);

  // Auto-save effect
  useEffect(() => {
    if (!selectedNote) return;

    // Skip if we haven't initialized lastSavedRef yet (happens on first selection)
    if (lastSavedRef.current === null) return;

    // Compare debounced values against what was last SAVED (not selectedNote which may have been updated)
    const hasContentChanged =
      debouncedContent !== lastSavedRef.current?.content ||
      debouncedTitle !== lastSavedRef.current?.title;

    // Cancel any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (hasContentChanged && (debouncedContent || debouncedTitle)) {
      // Store what we're about to save so we don't re-save the same thing
      pendingSaveRef.current = { title: debouncedTitle, content: debouncedContent };

      saveTimeoutRef.current = setTimeout(async () => {
        if (pendingSaveRef.current) {
          const noteToSave = {
            ...selectedNote,
            title: pendingSaveRef.current.title,
            content: pendingSaveRef.current.content
          };

          // Optimistically update lastSaved
          lastSavedRef.current = { title: debouncedTitle, content: debouncedContent };
          pendingSaveRef.current = null;

          await saveNote(noteToSave);
        }
      }, 1000); // 1 second buffer - enough to catch rapid typing
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [debouncedContent, debouncedTitle, selectedNote, saveNote]);

  // Update form when selected note changes
  useEffect(() => {
    if (selectedNote) {
      setFormData({
        title: selectedNote.title,
        content: selectedNote.content
      });
      // Initialize last saved state so we don't auto-save on selection
      lastSavedRef.current = {
        title: selectedNote.title,
        content: selectedNote.content
      };
    } else {
      setFormData({ title: "", content: "" });
    }
  }, [selectedNote?._id]);

  return (
    <div className="h-full flex flex-col">
      {/* Offline Banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-400 text-sm"
          >
            <WifiOff size={14} />
            <span>You're offline. Changes will be saved locally.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-white">Notes</h1>
          {isSaving && (
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <Loader2 size={12} className="animate-spin" />
              Saving...
            </span>
          )}
        </div>
        <button
          onClick={createNote}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          New Note
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3 p-4 border-b border-white/5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 text-sm"
          />
        </div>
        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg">
          {(["all", "pinned", "archived"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize",
                filter === f
                  ? "bg-primary/20 text-primary"
                  : "text-gray-400 hover:text-white"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 text-sm"
          >
            <AlertCircle size={14} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto hover:text-red-300">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Notes List */}
        <div className="w-80 border-r border-white/5 overflow-y-auto p-3 space-y-2">
          {isLoading && notes.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-gray-500" />
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notes yet</p>
              <button
                onClick={createNote}
                className="mt-2 text-primary hover:underline text-sm"
              >
                Create your first note
              </button>
            </div>
          ) : (
            <AnimatePresence>
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note._id}
                  note={note}
                  isSelected={selectedNote?._id === note._id}
                  onSelect={() => {
                    setSelectedNote(note);
                    setFormData({ title: note.title, content: note.content });
                  }}
                  onPin={() => togglePin(note)}
                  onArchive={() => toggleArchive(note)}
                  onDelete={() => openDeleteConfirm(note)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Editor Panel */}
        <div className="flex-1 flex flex-col">
          {selectedNote ? (
            <>
              {/* Note Header */}
              <div className="p-4 border-b border-white/5">
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Note title"
                  className="w-full text-lg font-semibold bg-transparent text-white placeholder-gray-500 focus:outline-none"
                  maxLength={200}
                />
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>Created {formatDate(selectedNote.createdAt)}</span>
                  <span>Modified {formatDate(selectedNote.updatedAt)}</span>
                </div>
              </div>

              {/* Rich Text Editor */}
              <div className="flex-1 relative">
                <RichTextEditor
                  value={formData.content}
                  onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                  maxLength={MAX_CONTENT_LENGTH}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FileText size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-sm">Select a note to view or edit</p>
                <p className="text-xs mt-1 opacity-50">Or create a new note</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}