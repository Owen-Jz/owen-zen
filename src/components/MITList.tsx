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

interface Task {
  _id: string;
  title: string;
  status: string; // or TaskStatus if imported
  priority: string; // or TaskPriority
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

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            // Finding index in the FULL list is tricky because we are sorting a subset
            // For true reordering of MITs, we should probably just reorder them relative to each other
            // But updating the main 'tasks' state requires mapping back
            
            // Simplified Logic: 
            // 1. Get the current sorted MIT list
            const currentMITs = [...mitTasks];
            const oldIndex = currentMITs.findIndex(t => t._id === active.id);
            const newIndex = currentMITs.findIndex(t => t._id === over.id);
            
            // 2. Reorder the subset
            const reorderedMITs = arrayMove(currentMITs, oldIndex, newIndex);
            
            // 3. Create a map of ID -> New Order
            const orderMap = new Map();
            reorderedMITs.forEach((t, i) => orderMap.set(t._id, i));
            
            // 4. Update the main tasks list 'order' field for these items
            // Note: This might conflict with the main board order. 
            // Ideally, MITs should have a separate 'mitOrder' field. 
            // For now, let's just visually update by updating the state locally if possible, 
            // but since we rely on 'tasks' prop, we must update the parent.
            
            // Constraint: We can't easily reorder the main list based on a subset drag without messing up non-MIT items.
            // PROPOSAL: Just swapping the 'order' values of the dragged items in the main list.
            
            const newTasks = tasks.map(t => {
                if (t._id === active.id) {
                    return { ...t, order: reorderedMITs[newIndex].order }; // Swap order values? No, that assumes clean swapping.
                }
                if (t._id === over.id) {
                    return { ...t, order: reorderedMITs[oldIndex].order };
                }
                return t;
            });
            
            // Actually, simplest 'visual' fix for now is just allowing the drag but not persisting complex reorder until we add 'mitOrder'.
            // Or just swap them in the main array.
             const mainOldIndex = tasks.findIndex(t => t._id === active.id);
             const mainNewIndex = tasks.findIndex(t => t._id === over.id);
             
             const reorderedMain = arrayMove(tasks, mainOldIndex, mainNewIndex);
             setTasks(reorderedMain);
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
