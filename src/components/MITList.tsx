"use client";

import { useSensors, useSensor, PointerSensor, KeyboardSensor, DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Target } from "lucide-react";
import { SortableMITItem } from "@/components/SortableMITItem";
import { Task } from "@/types/task";

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
            // Simplified Logic: 
            const currentMITs = [...mitTasks];
            const oldIndex = currentMITs.findIndex(t => t._id === active.id);
            const newIndex = currentMITs.findIndex(t => t._id === over.id);
            
            const reorderedMITs = arrayMove(currentMITs, oldIndex, newIndex);
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
