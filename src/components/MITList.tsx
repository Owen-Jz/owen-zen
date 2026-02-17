"use client";

import { useSensors, useSensor, PointerSensor, KeyboardSensor, DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Target } from "lucide-react";
import { SortableMITItem } from "@/components/SortableMITItem";

// Detailed Task Interface matching page.tsx
interface SubTask {
    title: string;
    completed: boolean;
}

interface TimeLog {
    startedAt: string;
    endedAt?: string;
    duration: number;
    note?: string;
}

interface ActiveTimer {
    startedAt?: string;
    isActive: boolean;
    sessionTitle?: string;
}

type TaskStatus = "pending" | "in-progress" | "completed" | "pinned";
type TaskPriority = "high" | "medium" | "low";

interface Task {
    _id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    createdAt: string;
    order: number;
    isArchived?: boolean;
    subtasks?: SubTask[];
    timeLogs?: TimeLog[];
    totalTimeSpent?: number;
    activeTimer?: ActiveTimer;
    isMIT: boolean;
}

interface MITListProps {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    onUpdateStatus: (id: string, status: TaskStatus) => void;
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

        if (!over || active.id === over.id) return;

        // 1. Get the current sorted MIT list
        const currentMITs = [...mitTasks];
        const oldIndex = currentMITs.findIndex(t => t._id === active.id);
        const newIndex = currentMITs.findIndex(t => t._id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        // 2. Reorder the subset locally
        const reorderedMITs = arrayMove(currentMITs, oldIndex, newIndex);

        // 3. Re-assign 'order' values to maintain relative ordering
        // We capture the existing order values from the MIT tasks and redistribute them
        // to the new task positions. This preserves their "slots" relative to non-MIT tasks.
        const sortedOrders = currentMITs.map(t => t.order).sort((a, b) => a - b);

        const updatedMITs = reorderedMITs.map((task, index) => ({
            ...task,
            order: sortedOrders[index]
        }));

        // 4. Update the main tasks state
        const newTasks = tasks.map(t => {
            const updatedTask = updatedMITs.find(ut => ut._id === t._id);
            return updatedTask ? updatedTask : t;
        });

        // Optimistic update
        setTasks(newTasks);

        // 5. Persist to API
        try {
            await fetch('/api/tasks', { // Batch update endpoint
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tasks: updatedMITs }),
            });
        } catch (error) {
            console.error("Failed to save reordered MIT tasks", error);
        }
    };

    if (mitTasks.length === 0) return null;

    return (
        <div className="mb-8 p-6 bg-gradient-to-r from-red-500/10 to-transparent border-l-4 border-red-500 rounded-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                <Target className="text-red-500" /> Daily Non-Negotiables (MITs)
            </h2>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={mitTasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-2">
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
