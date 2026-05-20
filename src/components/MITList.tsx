"use client";

import { useState, useEffect } from "react";
import { useSensors, useSensor, PointerSensor, KeyboardSensor, DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Target, Trophy, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { SortableMITItem } from "@/components/SortableMITItem";
import { useSoundContext } from "./SoundEffects";
import { Task } from "@/types";

interface MITListProps {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    onUpdateStatus: (id: string, status: string) => void;
    onToggleMIT: (id: string, isMIT: boolean) => void;
    onEditTask: (task: Task) => void;
    currentBoardId?: string | null;
}

export const MITList = ({ tasks, setTasks, onUpdateStatus, onToggleMIT, onEditTask, currentBoardId }: MITListProps) => {
    const [newMITTitle, setNewMITTitle] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const { playSound } = useSoundContext();
    const [mitStreak, setMitStreak] = useState(0);
    const [perfectDay, setPerfectDay] = useState(false);

    // Compute MIT streak
    useEffect(() => {
      const completedMits = tasks.filter(t => t.isMIT && t.status === "completed" && t.completedAt);
      if (completedMits.length === 0) { setMitStreak(0); return; }

      let streak = 0;
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(); checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        const hasCompleted = completedMits.some(t => t.completedAt?.startsWith(dateStr));
        if (hasCompleted) streak++;
        else if (i > 0) break;
      }
      setMitStreak(streak);
    }, [tasks]);

    const handleCompleteMIT = (id: string) => {
      onUpdateStatus(id, 'completed');
      const allComplete = mitTasks.length > 0 && mitTasks.every(t => t.status === "completed");
      if (allComplete && mitTasks.length > 0) {
        setPerfectDay(true);
        playSound('GOAL_ACHIEVED');
      }
    };

    // Filter MIT tasks
    const mitTasks = tasks.filter(t => t.isMIT && !t.isArchived && t.status !== 'completed').sort((a, b) => a.order - b.order);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        if (!over) return;

        if (active.id !== over.id) {
            const mainOldIndex = tasks.findIndex(t => t._id === active.id);
            const mainNewIndex = tasks.findIndex(t => t._id === over.id);

            let newTasks = arrayMove(tasks, mainOldIndex, mainNewIndex);

            // Update order for all to maintain the list position across the app
            newTasks = newTasks.map((t, index) => ({ ...t, order: index }));

            setTasks(newTasks);

            try {
                await fetch("/api/tasks", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        tasks: newTasks.map(t => ({
                            _id: t._id,
                            order: t.order,
                            status: t.status,
                            priority: t.priority,
                            isArchived: t.isArchived,
                        }))
                    }),
                });
            } catch (err) {
                console.error("Failed to update task order", err);
            }
        }
    };

    const handleAddMIT = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMITTitle.trim() || isAdding) return;
        setIsAdding(true);

        const title = newMITTitle;
        setNewMITTitle(""); // clear input optimistically

        try {
            const res = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    isMIT: true,
                    priority: "high",
                    boardId: currentBoardId || null
                }),
            });
            const json = await res.json();
            if (json.success) {
                setTasks(prev => [...prev, json.data]);
            }
        } catch (err) {
            console.error("Failed to add MIT", err);
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
                    <h2 className="text-lg font-bold text-white">
                        Daily Non-Negotiables
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    {mitStreak > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-full">
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                <Flame size={12} className="text-orange-500" />
                            </motion.div>
                            <span className="text-xs font-bold text-orange-400">{mitStreak} day streak</span>
                        </div>
                    )}
                    {perfectDay && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full animate-pulse">
                            <Trophy size={12} className="text-emerald-400" />
                            <span className="text-xs font-bold text-emerald-400">Perfect Day!</span>
                        </div>
                    )}
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={mitTasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                        {mitTasks.map(task => (
                            <SortableMITItem
                                key={task._id}
                                task={task}
                                onComplete={(id) => handleCompleteMIT(id)}
                                onRemoveMIT={(id) => onToggleMIT(id, false)}
                                onEdit={onEditTask}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {/* Quick Add MIT Input */}
            <form onSubmit={handleAddMIT} className="mt-3 relative group">
                <input
                    type="text"
                    value={newMITTitle}
                    onChange={(e) => setNewMITTitle(e.target.value)}
                    placeholder="Add a new Daily Negotiable..."
                    className="w-full bg-surface/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all font-medium"
                    disabled={isAdding}
                />
                <button
                    type="submit"
                    disabled={!newMITTitle.trim() || isAdding}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold uppercase tracking-wider text-red-500 opacity-0 group-hover:opacity-100 disabled:opacity-0 transition-opacity px-2 py-1"
                >
                    Add
                </button>
            </form>
        </div>
    );
};
