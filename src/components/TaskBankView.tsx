"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Landmark, RotateCcw, Trash2, CheckSquare, Square, LayoutGrid, List } from "lucide-react";
import { Task } from "@/types";
import { cn } from "@/lib/utils";

const priorityColors = {
  high: "border-l-4 border-red-500",
  medium: "border-l-4 border-yellow-500",
  low: "border-l-4 border-blue-500"
};

const priorityBg = {
  high: "bg-red-500/10 text-red-400",
  medium: "bg-yellow-500/10 text-yellow-400",
  low: "bg-blue-500/10 text-blue-400"
};

export const TaskBankView = ({
  tasks,
  onRestore,
  onDelete
}: {
  tasks: Task[];
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const bankedTasks = tasks.filter(t => t.isBanked && t.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (selected) newSet.add(id);
      else newSet.delete(id);
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedTasks(new Set(bankedTasks.map(t => t._id)));
  };

  const handleClearSelection = () => {
    setSelectedTasks(new Set());
  };

  const handleBulkRestore = () => {
    selectedTasks.forEach(id => onRestore(id));
    setSelectedTasks(new Set());
  };

  const handleBulkDelete = () => {
    selectedTasks.forEach(id => onDelete(id));
    setSelectedTasks(new Set());
    setConfirmDelete(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-400">
          <Landmark size={20} className="text-primary" />
          Task Landmark
          <span className="text-xs font-mono bg-surface px-2 py-0.5 rounded-full border border-white/10">
            {bankedTasks.length}
          </span>
        </h2>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search bank..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-hover border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        </div>

        <div className="flex items-center gap-1 bg-surface-hover border border-white/5 rounded-xl p-1">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === "list" ? "bg-primary/20 text-primary" : "text-gray-500 hover:text-white"
            )}
            title="List view"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === "grid" ? "bg-primary/20 text-primary" : "text-gray-500 hover:text-white"
            )}
            title="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedTasks.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between bg-surface/80 border border-primary/30 rounded-xl p-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-primary">{selectedTasks.size} selected</span>
              <button onClick={handleClearSelection} className="text-gray-500 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBulkRestore}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors"
              >
                <RotateCcw size={14} /> Restore to Backlog
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmDelete(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border border-border w-full max-w-sm rounded-2xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-2">Delete {selectedTasks.size} task{selectedTasks.size > 1 ? "s" : ""}?</h3>
              <p className="text-sm text-gray-400 mb-6">This is permanent. Tasks will be deleted from the bank and cannot be recovered.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-gray-400 hover:bg-white/5 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors font-bold"
                >
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task List */}
      {bankedTasks.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <Landmark size={40} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-500 font-medium">No tasks in the bank</p>
          <p className="text-sm text-gray-600 mt-1">Move tasks here when they're not relevant right now</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bankedTasks.map(task => (
            <motion.div
              key={task._id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "p-4 bg-surface/40 border border-white/5 rounded-2xl hover:bg-surface/60 transition-all group cursor-pointer",
                priorityColors[task.priority],
                selectedTasks.has(task._id) && "border-primary/50 bg-primary/5"
              )}
              onClick={() => handleSelect(task._id, !selectedTasks.has(task._id))}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                  priorityBg[task.priority]
                )}>
                  {task.priority}
                </span>
                {selectedTasks.has(task._id) && (
                  <CheckSquare size={16} className="text-primary shrink-0" />
                )}
              </div>
              <p className="text-gray-200 font-medium mb-2 line-clamp-2">{task.title}</p>
              {task.subtasks && task.subtasks.length > 0 && (
                <p className="text-xs text-gray-500">
                  {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
                </p>
              )}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); onRestore(task._id); }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors"
                >
                  <RotateCcw size={12} /> Restore
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(task._id); }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {bankedTasks.length > 0 && selectedTasks.size === 0 && (
            <div className="flex justify-end mb-2">
              <button
                onClick={handleSelectAll}
                className="text-xs text-gray-500 hover:text-white transition-colors"
              >
                Select All ({bankedTasks.length})
              </button>
            </div>
          )}
          {bankedTasks.map(task => (
            <motion.div
              key={task._id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex items-center gap-4 p-4 bg-surface/40 border border-white/5 rounded-2xl hover:bg-surface/60 transition-all group",
                priorityColors[task.priority],
                selectedTasks.has(task._id) && "border-primary/50 bg-primary/5"
              )}
            >
              {/* Selection */}
              <button
                onClick={() => handleSelect(task._id, !selectedTasks.has(task._id))}
                className={cn(
                  "shrink-0 p-1 rounded transition-colors",
                  selectedTasks.has(task._id) ? "text-primary" : "text-gray-600 hover:text-gray-400"
                )}
              >
                {selectedTasks.has(task._id) ? <CheckSquare size={18} /> : <Square size={18} />}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "text-sm font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                    priorityBg[task.priority]
                  )}>
                    {task.priority}
                  </span>
                </div>
                <p className="text-gray-200 font-medium truncate">{task.title}</p>
                {task.subtasks && task.subtasks.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => { onRestore(task._id); handleSelect(task._id, false); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  title="Restore to Backlog"
                >
                  <RotateCcw size={14} /> Restore
                </button>
                <button
                  onClick={() => { onDelete(task._id); handleSelect(task._id, false); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Delete permanently"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};