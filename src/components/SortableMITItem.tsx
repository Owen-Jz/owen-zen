"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, X, GripVertical } from "lucide-react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Task } from "@/types/task";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface SortableMITItemProps {
  task: Task;
  onComplete: (id: string) => void;
  onRemoveMIT: (id: string) => void;
}

export const SortableMITItem = ({ task, onComplete, onRemoveMIT }: SortableMITItemProps) => {
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
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-surface border border-border p-4 rounded-xl flex items-center justify-between group transition-all",
        isDragging && "opacity-50 ring-2 ring-primary z-50 bg-surface-hover"
      )}
    >
      <div className="flex items-center gap-3">
        <button {...attributes} {...listeners} className="p-1 text-gray-500 hover:text-white cursor-grab active:cursor-grabbing">
          <GripVertical size={16} />
        </button>
        <span className="font-bold text-lg">{task.title}</span>
      </div>
      
      <div className="flex gap-2">
        <button 
            onClick={() => onComplete(task._id)}
            className="p-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30 transition-all"
            title="Complete"
        >
            <Check size={18} />
        </button>
        <button 
            onClick={() => onRemoveMIT(task._id)}
            className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/10"
            title="Remove from MIT"
        >
            <X size={18} />
        </button>
      </div>
    </div>
  );
};
