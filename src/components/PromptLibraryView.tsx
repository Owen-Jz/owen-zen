"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Edit2, Trash2, Search, MessageSquare } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface Prompt {
  _id: string;
  title: string;
  prompt: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = ["Writing", "Coding", "Brainstorming", "Personal", "Other"];

export default function PromptLibraryView() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formPrompt, setFormPrompt] = useState("");
  const [formCategory, setFormCategory] = useState("Other");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPrompts();
  }, [categoryFilter, search]);

  const fetchPrompts = async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== "All") params.set("category", categoryFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/prompts?${params}`);
      const json = await res.json();
      if (json.success) {
        setPrompts(json.data);
      }
    } catch (error) {
      console.error("Error fetching prompts:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (prompt?: Prompt) => {
    if (prompt) {
      setEditingPrompt(prompt);
      setFormTitle(prompt.title);
      setFormPrompt(prompt.prompt);
      setFormCategory(prompt.category);
    } else {
      setEditingPrompt(null);
      setFormTitle("");
      setFormPrompt("");
      setFormCategory("Other");
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPrompt(null);
    setFormTitle("");
    setFormPrompt("");
    setFormCategory("Other");
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formPrompt.trim()) return;

    setSaving(true);
    try {
      if (editingPrompt) {
        const res = await fetch(`/api/prompts/${editingPrompt._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: formTitle, prompt: formPrompt, category: formCategory }),
        });
        const json = await res.json();
        if (json.success) {
          setPrompts(prompts.map(p => p._id === editingPrompt._id ? json.data : p));
        }
      } else {
        const res = await fetch("/api/prompts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: formTitle, prompt: formPrompt, category: formCategory }),
        });
        const json = await res.json();
        if (json.success) {
          setPrompts([json.data, ...prompts]);
        }
      }
      closeModal();
    } catch (error) {
      console.error("Error saving prompt:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this prompt?")) return;

    try {
      const res = await fetch(`/api/prompts/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setPrompts(prompts.filter(p => p._id !== id));
      }
    } catch (error) {
      console.error("Error deleting prompt:", error);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Writing: "bg-blue-500/20 text-blue-400",
      Coding: "bg-green-500/20 text-green-400",
      Brainstorming: "bg-purple-500/20 text-purple-400",
      Personal: "bg-pink-500/20 text-pink-400",
      Other: "bg-gray-500/20 text-gray-400",
    };
    return colors[category] || colors.Other;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Prompt Library</h1>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:brightness-110 transition-all font-medium"
        >
          <Plus size={20} /> Add Prompt
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search prompts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 focus:border-primary outline-none transition-all"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-surface border border-border rounded-xl px-4 py-2.5 focus:border-primary outline-none transition-all"
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Prompt Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading prompts...</div>
      ) : prompts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No prompts yet. Click "Add Prompt" to create your first one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prompts.map((prompt) => (
            <motion.div
              key={prompt._id}
              layout
              className="bg-surface border border-border rounded-xl p-4 hover:border-primary/50 transition-all cursor-pointer"
              onClick={() => setExpandedId(expandedId === prompt._id ? null : prompt._id)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-lg truncate flex-1">{prompt.title}</h3>
                <span className={cn("text-xs px-2 py-1 rounded-full shrink-0 ml-2", getCategoryColor(prompt.category))}>
                  {prompt.category}
                </span>
              </div>
              <p className={cn("text-gray-400 text-sm", expandedId !== prompt._id && "line-clamp-2")}>
                {prompt.prompt}
              </p>

              {expandedId === prompt._id && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <button
                    onClick={(e) => { e.stopPropagation(); openModal(prompt); }}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(prompt._id); }}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-lg bg-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6"
            >
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-bold mb-4">
                {editingPrompt ? "Edit Prompt" : "Add New Prompt"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g., Blog Post Intro"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:border-primary outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:border-primary outline-none transition-all"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Prompt</label>
                  <textarea
                    value={formPrompt}
                    onChange={(e) => setFormPrompt(e.target.value)}
                    placeholder="Enter your prompt here..."
                    rows={6}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:border-primary outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-gray-400 hover:bg-white/5 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formTitle.trim() || !formPrompt.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white hover:brightness-110 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : editingPrompt ? "Update" : "Create"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
