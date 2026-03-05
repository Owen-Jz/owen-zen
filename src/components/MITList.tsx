"use client";

import { useState } from "react";
import { useSensors, useSensor, PointerSensor, KeyboardSensor, DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Target } from "lucide-react";
import { SortableMITItem } from "@/components/SortableMITItem";
import { Task } from "@/types";

interface MITListProps {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    onUpdateStatus: (id: string, status: string) => void;
    onToggleMIT: (id: string, isMIT: boolean) => void;
    currentBoardId?: string | null;
}

export const MITList = ({ tasks, setTasks, onUpdateStatus, onToggleMIT, currentBoardId }: MITListProps) => {
    const [newMITTitle, setNewMITTitle] = useState("");
    const [isAdding, setIsAdding] = useState(false);

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
            <div className="flex items-center gap-3 mb-4 px-2">
                <div className="w-1 h-6 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.5)]"></div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                    Daily Non-Negotiables <span className="text-gray-500 text-sm font-normal ml-2 tracking-normal uppercase opacity-70">Most Important Tasks</span>
                </h2>
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
                                onComplete={(id) => onUpdateStatus(id, 'completed')}
                                onRemoveMIT={(id) => onToggleMIT(id, false)}
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
