"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronRight, ChevronDown, Circle, CheckCircle2, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface Goal {
  _id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'achieved';
  parentId?: string | null;
  children?: Goal[];
}

const GoalItem = ({
  goal,
  onUpdate,
  onDelete,
  onAddSubGoal
}: {
  goal: Goal,
  onUpdate: (id: string, updates: Partial<Goal>) => void,
  onDelete: (id: string) => void,
  onAddSubGoal: (parentId: string) => void
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(goal.title);

  const hasChildren = goal.children && goal.children.length > 0;

  const handleToggleStatus = () => {
    const newStatus = goal.status === 'achieved' ? 'pending' : 'achieved';
    onUpdate(goal._id, { status: newStatus });
  };

  const handleSaveTitle = () => {
    if (editTitle.trim() !== goal.title) {
      onUpdate(goal._id, { title: editTitle });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveTitle();
    if (e.key === 'Escape') {
      setEditTitle(goal.title);
      setIsEditing(false);
    }
  };

  // Compute recursive progress
  const getProgress = (g: Goal): { total: number, completed: number } => {
    if (!g.children || g.children.length === 0) {
      return { total: 1, completed: g.status === 'achieved' ? 1 : 0 };
    }
    let total = 0;
    let completed = 0;
    g.children.forEach(child => {
      const childProgress = getProgress(child);
      total += childProgress.total;
      completed += childProgress.completed;
    });
    return { total, completed };
  };

  const progress = hasChildren ? getProgress(goal) : null;
  const progressPercent = progress ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <div className="group animate-in fade-in slide-in-from-left-2 duration-300 mb-3">
      <div className={cn(
        "flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-white/5 transition-colors group/item border border-white/5 hover:border-white/10 shadow-sm bg-black/20 backdrop-blur-sm",
        goal.status === 'achieved' && "opacity-60 bg-black/10"
      )}>
        {/* Expand Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "p-1 rounded hover:bg-white/10 text-gray-500 transition-colors shrink-0",
            !hasChildren && "opacity-0 pointer-events-none"
          )}
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Checkbox */}
        <button
          onClick={handleToggleStatus}
          className={cn(
            "shrink-0 transition-colors",
            goal.status === 'achieved' ? "text-primary/70" : "text-gray-600 hover:text-gray-400"
          )}
        >
          {goal.status === 'achieved' ? <CheckCircle2 size={18} /> : <Circle size={18} />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0 ml-1">
          {isEditing ? (
            <input
              autoFocus
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent border-b border-primary outline-none py-0.5 text-base font-medium"
            />
          ) : (
            <div className="flex flex-col">
              <div
                onClick={() => setIsEditing(true)}
                className={cn(
                  "py-0.5 text-base font-bold cursor-text break-words select-none tracking-wide text-gray-200",
                  goal.status === 'achieved' && "line-through text-gray-500"
                )}
              >
                {goal.title}
              </div>
              {hasChildren && progress && (
                <div className="flex items-center gap-3 mt-1.5 opacity-80">
                  <div className="h-1 w-24 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500 shadow-[0_0_10px_rgba(var(--primary),0.8)]"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-gray-400 tracking-widest">{progressPercent}%</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="opacity-0 group-hover/item:opacity-100 flex items-center gap-1 transition-opacity">
          <button
            onClick={() => onAddSubGoal(goal._id)}
            className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
            title="Add Sub-goal"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => onDelete(goal._id)}
            className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="pl-6 md:pl-9 relative border-l border-white/5 ml-3 md:ml-4 my-1">
          <div className="pl-2">
            {goal.children!.map(child => (
              <GoalItem
                key={child._id}
                goal={child}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onAddSubGoal={onAddSubGoal}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const RoadmapView = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTopLevelGoal, setNewTopLevelGoal] = useState("");

  // Build tree structure locally from flat list
  const buildTree = (items: Goal[]) => {
    // Deep clone to avoid mutating state directly during construct
    const itemMap = new Map<string, Goal>();
    const roots: Goal[] = [];

    // Initialize map with copies
    items.forEach(item => {
      itemMap.set(item._id, { ...item, children: [] });
    });

    // Build hierarchy
    items.forEach(item => {
      const node = itemMap.get(item._id)!;
      if (item.parentId) {
        const parent = itemMap.get(item.parentId);
        if (parent) {
          parent.children?.push(node);
        } else {
          roots.push(node); // Orphaned or parent not in current set
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const fetchGoals = async () => {
    try {
      const res = await fetch("/api/goals");
      const json = await res.json();
      if (json.success) {
        setGoals(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch goals", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const addGoal = async (title: string, parentId: string | null = null) => {
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, parentId, year: 2026 })
      });
      const json = await res.json();
      if (json.success) {
        setGoals(prev => [...prev, json.data]);
        return true;
      }
    } catch (error) {
      console.error("Failed to add goal", error);
    }
    return false;
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    // Optimistic update
    const originalGoals = [...goals];
    setGoals(prev => prev.map(g => g._id === id ? { ...g, ...updates } : g));

    try {
      await fetch(`/api/goals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
    } catch (error) {
      setGoals(originalGoals);
      console.error("Failed to update goal", error);
    }
  };

  const deleteGoal = async (id: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;

    // Recursive removal in local state
    const getDescendantIds = (parentId: string, allGoals: Goal[]): string[] => {
      const children = allGoals.filter(g => g.parentId === parentId);
      let ids = children.map(c => c._id);
      children.forEach(c => {
        ids = [...ids, ...getDescendantIds(c._id, allGoals)];
      });
      return ids;
    };

    const idsToRemove = [id, ...getDescendantIds(id, goals)];
    const originalGoals = [...goals];

    setGoals(prev => prev.filter(g => !idsToRemove.includes(g._id)));

    try {
      await fetch(`/api/goals/${id}`, { method: "DELETE" });
    } catch (error) {
      setGoals(originalGoals);
      console.error("Delete failed", error);
    }
  };

  const handleAddTopLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopLevelGoal.trim()) return;
    const success = await addGoal(newTopLevelGoal);
    if (success) setNewTopLevelGoal("");
  };

  const handleAddSubGoal = async (parentId: string) => {
    // Simple prompt for now, could be inline input in future
    const title = prompt("Enter sub-goal / idea:");
    if (title && title.trim()) {
      await addGoal(title, parentId);
    }
  };

  const tree = buildTree(goals);

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="mb-12 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">2026: The Year of <span className="text-primary">Sovereignty</span></h1>
        <p className="text-gray-400 text-lg">Define your vision. Structure your path. Execute relentlessly.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Input Area */}
          <form onSubmit={handleAddTopLevel} className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
            <input
              type="text"
              value={newTopLevelGoal}
              onChange={(e) => setNewTopLevelGoal(e.target.value)}
              placeholder="What is your main objective?"
              className="w-full bg-surface/50 backdrop-blur-sm border border-border rounded-xl px-6 py-5 pl-14 focus:border-primary outline-none transition-all placeholder:text-gray-500 text-lg shadow-lg relative z-10"
            />
            <Plus className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 z-20" size={24} />
            {newTopLevelGoal.trim() && (
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 px-5 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all shadow-lg z-20"
              >
                Add Goal
              </button>
            )}
          </form>

          {/* Goal Tree */}
          {tree.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-surface/20">
              <p className="text-gray-500">No goals set yet.</p>
            </div>
          ) : (
            <div className="bg-surface/20 border border-white/5 rounded-2xl p-6 md:p-8 min-h-[300px]">
              {tree.map(rootGoal => (
                <GoalItem
                  key={rootGoal._id}
                  goal={rootGoal}
                  onUpdate={updateGoal}
                  onDelete={deleteGoal}
                  onAddSubGoal={handleAddSubGoal}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
