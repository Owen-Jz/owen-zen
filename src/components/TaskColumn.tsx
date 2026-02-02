// ... imports
import {
  useDroppable, // Add this
  // ... other imports
} from "@dnd-kit/core";

// ... other components

// --- Droppable Column Component ---
const TaskColumn = ({ id, title, tasks, onDelete, onUpdateStatus, onEdit, onArchive }: any) => {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div 
      ref={setNodeRef} // Make the WHOLE div droppable
      className="bg-surface/30 p-4 rounded-xl border border-border min-h-[500px] flex flex-col"
    >
      <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider flex justify-between">
          {title}
          <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs text-white">
              {tasks.length}
          </span>
      </h3>
      <SortableContext 
        items={tasks.map((t: any) => t._id)} 
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3 flex-1">
          {tasks.map((task: any) => (
            <SortableTaskItem 
              key={task._id} 
              task={task} 
              onDelete={onDelete}
              onUpdateStatus={onUpdateStatus}
              onEdit={onEdit}
              onArchive={onArchive}
            />
          ))}
          {/* Invisible spacer to make dropping easier */}
          <div className="h-10 w-full" /> 
        </div>
      </SortableContext>
    </div>
  );
};
