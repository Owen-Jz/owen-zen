"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, X, Bot, User, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Note {
  _id: string;
  title: string;
  content: string;
  source: 'manual' | 'ai';
  createdAt: string;
  updatedAt: string;
}

export const NotesView = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [editNote, setEditNote] = useState({ title: "", content: "" });

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/notes");
      const data = await res.json();
      if (data.success) {
        setNotes(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    }
    setIsLoading(false);
  };

  const createNote = async () => {
    if (!newNote.title.trim()) return;
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newNote, source: "manual" }),
      });
      const data = await res.json();
      if (data.success) {
        setNotes([data.data, ...notes]);
        setNewNote({ title: "", content: "" });
        setIsAdding(false);
      }
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  const updateNote = async (id: string) => {
    if (!editNote.title.trim()) return;
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editNote),
      });
      const data = await res.json();
      if (data.success) {
        setNotes(notes.map(n => n._id === id ? data.data : n));
        setEditingId(null);
      }
    } catch (error) {
      console.error("Failed to update note:", error);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setNotes(notes.filter(n => n._id !== id));
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <FileText size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Notes</h1>
            <p className="text-sm text-gray-500">{notes.length} notes</p>
          </div>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:brightness-110 transition-all font-medium text-sm"
        >
          <Plus size={16} />
          New Note
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-surface border border-border rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && createNote()}
                placeholder="Note title..."
                className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-sm focus:border-primary outline-none"
                autoFocus
              />
              <button
                onClick={() => setIsAdding(false)}
                className="p-2 text-gray-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <textarea
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              placeholder="Write your note..."
              rows={4}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none resize-none mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={createNote}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:brightness-110 transition-all font-medium text-sm"
              >
                <Save size={16} />
                Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading notes...</p>
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={24} className="text-gray-500" />
          </div>
          <p className="text-gray-400 text-lg mb-2">No notes yet</p>
          <p className="text-gray-600 text-sm">Create your first note or let AI add insights</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notes.map((note) => (
            <div
              key={note._id}
              className="bg-surface border border-border rounded-2xl p-5 hover:border-primary/30 transition-all group"
            >
              {editingId === note._id ? (
                <div>
                  <input
                    type="text"
                    value={editNote.title}
                    onChange={(e) => setEditNote({ ...editNote, title: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:border-primary outline-none mb-3"
                    autoFocus
                  />
                  <textarea
                    value={editNote.content}
                    onChange={(e) => setEditNote({ ...editNote, content: e.target.value })}
                    rows={4}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:border-primary outline-none resize-none mb-3"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-2 text-gray-500 hover:text-white transition-colors"
                    >
                      <X size={16} />
                    </button>
                    <button
                      onClick={() => updateNote(note._id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg hover:brightness-110 transition-all text-sm"
                    >
                      <Save size={14} />
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-semibold text-sm line-clamp-1">{note.title}</h3>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingId(note._id);
                          setEditNote({ title: note.title, content: note.content });
                        }}
                        className="p-1.5 text-gray-500 hover:text-primary transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => deleteNote(note._id)}
                        className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-4 mb-4 whitespace-pre-wrap">
                    {note.content}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      {note.source === "ai" ? (
                        <>
                          <Bot size={12} className="text-purple-400" />
                          <span className="text-purple-400">AI</span>
                        </>
                      ) : (
                        <>
                          <User size={12} />
                          <span>Manual</span>
                        </>
                      )}
                    </div>
                    <span>{formatDate(note.updatedAt)}</span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
