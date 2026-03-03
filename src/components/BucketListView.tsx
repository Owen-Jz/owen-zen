"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, CheckCircle2, Circle, ChevronDown, Star } from "lucide-react";

interface BucketItem {
  _id: string;
  title: string;
  category: string;
  completed: boolean;
  completedAt?: string | null;
  notes: string;
  createdAt: string;
}

const CATEGORIES = ["Travel", "Experience", "Finance", "Health", "Career", "Personal", "Faith", "Other"];

const CATEGORY_COLORS: Record<string, string> = {
  Travel: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  Experience: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  Finance: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Health: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  Career: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Personal: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
  Faith: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  Other: "text-gray-400 bg-gray-400/10 border-gray-400/20",
};

export function BucketListView() {
  const [items, setItems] = useState<BucketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Personal");
  const [newNotes, setNewNotes] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    fetch("/api/bucket-list")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setItems(j.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const res = await fetch("/api/bucket-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim(), category: newCategory, notes: newNotes.trim() }),
    });
    const json = await res.json();
    if (json.success) {
      setItems((prev) => [json.data, ...prev]);
      setNewTitle("");
      setNewNotes("");
      setNewCategory("Personal");
      setIsAdding(false);
    }
  };

  const toggleComplete = async (item: BucketItem) => {
    const updated = {
      completed: !item.completed,
      completedAt: !item.completed ? new Date().toISOString() : null,
    };
    setItems((prev) => prev.map((i) => (i._id === item._id ? { ...i, ...updated } : i)));
    await fetch(`/api/bucket-list/${item._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
  };

  const deleteItem = async (id: string) => {
    setItems((prev) => prev.filter((i) => i._id !== id));
    await fetch(`/api/bucket-list/${id}`, { method: "DELETE" });
  };

  const pending = items.filter((i) => !i.completed);
  const completed = items.filter((i) => i.completed);

  const filtered = (list: BucketItem[]) =>
    filterCategory === "All" ? list : list.filter((i) => i.category === filterCategory);

  const progress = items.length > 0 ? Math.round((completed.length / items.length) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Star className="text-primary w-6 h-6" />
            2026 Bucket List
          </h2>
          <p className="text-sm text-gray-500 mt-1">Things to do, experience, and conquer this year.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25 shrink-0"
        >
          <Plus size={18} />
          Add Item
        </button>
      </div>

      {/* Progress Bar */}
      {items.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">{completed.length} of {items.length} completed</span>
            <span className="text-primary font-bold">{progress}%</span>
          </div>
          <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {["All", ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border whitespace-nowrap transition-all ${filterCategory === cat
                ? "bg-primary/20 border-primary text-primary"
                : "bg-surface border-border text-gray-400 hover:text-white hover:border-white/20"
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={addItem}
            className="bg-surface border border-border rounded-xl p-5 space-y-4"
          >
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What do you want to do in 2026?"
              className="w-full bg-surface-hover border border-white/5 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 text-sm"
            />
            <div className="flex gap-3">
              <div className="relative flex-1">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full appearance-none bg-surface-hover border border-white/5 rounded-lg px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-primary/50 pr-8"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Notes (optional)..."
              rows={2}
              className="w-full bg-surface-hover border border-white/5 rounded-lg px-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-primary/50 resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-gray-400 hover:text-white rounded-lg border border-white/5 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors"
              >
                Add to List
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Pending Items */}
      {loading ? (
        <div className="text-center py-12 text-gray-600">Loading...</div>
      ) : (
        <>
          {filtered(pending).length === 0 && filtered(completed).length === 0 && (
            <div className="text-center py-16 border border-dashed border-border rounded-xl text-gray-600">
              <Star size={32} className="mx-auto mb-3 opacity-30" />
              <p>No bucket list items yet.</p>
              <p className="text-sm mt-1">Add something epic to do in 2026 👆</p>
            </div>
          )}

          <div className="space-y-2">
            {filtered(pending).map((item) => (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-surface border border-border rounded-xl px-4 py-3.5 flex items-start gap-3 hover:border-white/10 transition-all"
              >
                <button
                  onClick={() => toggleComplete(item)}
                  className="mt-0.5 text-gray-600 hover:text-primary transition-colors shrink-0"
                >
                  <Circle size={20} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{item.title}</p>
                  {item.notes && <p className="text-gray-500 text-xs mt-0.5 truncate">{item.notes}</p>}
                  <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-md border font-medium ${CATEGORY_COLORS[item.category]}`}>
                    {item.category}
                  </span>
                </div>
                <button
                  onClick={() => deleteItem(item._id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-500 transition-all shrink-0 mt-0.5"
                >
                  <Trash2 size={15} />
                </button>
              </motion.div>
            ))}
          </div>

          {/* Completed Section */}
          {filtered(completed).length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setShowCompleted((v) => !v)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors w-full"
              >
                <CheckCircle2 size={15} className="text-emerald-500" />
                <span>{completed.length} Completed</span>
                <ChevronDown size={14} className={`ml-auto transition-transform ${showCompleted ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {showCompleted && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    {filtered(completed).map((item) => (
                      <motion.div
                        key={item._id}
                        layout
                        className="group bg-surface/50 border border-border rounded-xl px-4 py-3.5 flex items-start gap-3 opacity-60 hover:opacity-90 transition-all"
                      >
                        <button
                          onClick={() => toggleComplete(item)}
                          className="mt-0.5 text-emerald-500 shrink-0"
                        >
                          <CheckCircle2 size={20} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-400 text-sm line-through">{item.title}</p>
                          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-md border font-medium ${CATEGORY_COLORS[item.category]}`}>
                            {item.category}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteItem(item._id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-500 transition-all shrink-0"
                        >
                          <Trash2 size={15} />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  );
}
