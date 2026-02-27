"use client";

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
}

export const MITList = ({ tasks, setTasks, onUpdateStatus, onToggleMIT }: MITListProps) => {
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

    if (mitTasks.length === 0) return null;

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
        </div>
    );
};
