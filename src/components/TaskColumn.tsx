import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GripVertical, MoreVertical, Edit2, Circle, Clock, Check, Archive, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Types needed here
type TaskStatus = "pending" | "in-progress" | "completed";
type TaskPriority = "high" | "medium" | "low";

interface SubTask {
  title: string;
  completed: boolean;
}

interface Task {
  _id: string; 
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  order: number;
  isArchived?: boolean;
  subtasks?: SubTask[];
}

// --- Sortable Task Item ---
export const SortableTaskItem = ({ 
  task, 
  onDelete, 
  onUpdateStatus, 
  onEdit, 
  onArchive,
  onToggleSubtask
}: { 
  task: Task; 
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onArchive: (id: string) => void;
  onToggleSubtask: (taskId: string, index: number) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColors = {
    "high": "border-l-4 border-red-500",
    "medium": "border-l-4 border-yellow-500",
    "low": "border-l-4 border-blue-500"
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuAction = (action: () => void) => {
    action();
    setMenuOpen(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center justify-between p-4 bg-surface hover:bg-surface-hover border border-border rounded-r-xl transition-colors mb-3 relative",
        priorityColors[task.priority] || priorityColors["medium"]
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button {...attributes} {...listeners} className="p-2 cursor-grab active:cursor-grabbing text-gray-500 hover:text-white shrink-0">
          <GripVertical size={16} />
        </button>
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <span className={cn("text-sm md:text-base font-medium transition-all break-words leading-relaxed pr-2", task.status === "completed" && "text-gray-500 line-through")}>
            {task.title}
          </span>
          {task.subtasks && task.subtasks.length > 0 && (
              <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-full max-w-[100px] h-1 bg-surface-hover rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-primary transition-all duration-300" 
                            style={{ width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%` }} 
                        />
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">
                        {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                    </span>
                  </div>
                  
                  {/* Expanded Subtasks */}
                  <div className="space-y-1 pl-1">
                      {task.subtasks.map((st, i) => (
                          <div 
                              key={i} 
                              onClick={(e) => {
                                  e.stopPropagation(); // Prevent drag start
                                  onToggleSubtask(task._id, i);
                              }}
                              className="flex items-start gap-2 group/sub cursor-pointer hover:bg-white/5 p-1 rounded transition-colors"
                          >
                              <div className={cn(
                                  "w-3 h-3 mt-0.5 rounded-[3px] border flex items-center justify-center transition-all",
                                  st.completed ? "bg-primary border-primary" : "border-gray-600 group-hover/sub:border-primary"
                              )}>
                                  {st.completed && <Check size={8} className="text-white" />}
                              </div>
                              <span className={cn(
                                  "text-xs text-gray-400 transition-colors leading-tight",
                                  st.completed && "text-gray-600 line-through"
                              )}>
                                  {st.title}
                              </span>
                          </div>
                      ))}
                  </div>
              </div>
          )}
          <div className="flex items-center gap-2 md:hidden">
             <span className={cn("text-[10px] uppercase font-bold", task.priority === 'high' ? "text-red-500" : task.priority === 'medium' ? "text-yellow-500" : "text-blue-500")}>
               {task.priority}
             </span>
          </div>
        </div>
      </div>
      
      <div className="hidden md:flex items-center gap-2 mr-2">
         <span className={cn(
             "text-[10px] uppercase font-bold px-2 py-1 rounded bg-white/5",
             task.priority === 'high' ? "text-red-500" : task.priority === 'medium' ? "text-yellow-500" : "text-blue-500"
         )}>
             {task.priority}
         </span>
      </div>

      <div className="relative" ref={menuRef}>
        <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5">
          <MoreVertical size={18} />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden"
            >
              <div className="p-1">
                <button onClick={() => handleMenuAction(() => onEdit(task))} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg text-left">
                  <Edit2 size={14} /> Edit Task
                </button>
                <div className="h-px bg-border my-1" />
                <div className="px-3 py-1 text-[10px] text-gray-500 uppercase font-bold">Move To</div>
                <button onClick={() => handleMenuAction(() => onUpdateStatus(task._id, "pending"))} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg text-left">
                  <Circle size={14} /> Backlog
                </button>
                <button onClick={() => handleMenuAction(() => onUpdateStatus(task._id, "in-progress"))} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg text-left">
                  <Clock size={14} /> In Focus
                </button>
                <button onClick={() => handleMenuAction(() => onUpdateStatus(task._id, "completed"))} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-lg text-left">
                  <Check size={14} /> Done
                </button>
                <div className="h-px bg-border my-1" />
                {task.status === "completed" && (
                   <button onClick={() => handleMenuAction(() => onArchive(task._id))} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-yellow-500 hover:bg-yellow-500/10 rounded-lg text-left">
                     <Archive size={14} /> Archive
                   </button>
                )}
                <button onClick={() => handleMenuAction(() => onDelete(task._id))} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg text-left">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- Task Column ---
export const TaskColumn = ({ id, title, tasks, onDelete, onUpdateStatus, onEdit, onArchive, onToggleSubtask }: any) => {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div 
      ref={setNodeRef}
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
              onToggleSubtask={onToggleSubtask}
            />
          ))}
          {/* Invisible spacer */}
          <div className="h-10 w-full" /> 
        </div>
      </SortableContext>
    </div>
  );
};
