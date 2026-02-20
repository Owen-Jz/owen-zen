"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, X, GripVertical } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Task } from "@/types";

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
        "group flex items-center justify-between p-4 bg-surface/40 backdrop-blur-md rounded-xl border border-white/5 shadow-sm transition-all hover:bg-surface/80 hover:shadow-lg hover:border-primary/20",
        isDragging && "opacity-80 ring-2 ring-primary z-50 scale-105 shadow-2xl bg-surface"
      )}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Drag Handle */}
        <button {...attributes} {...listeners} className="text-gray-600 hover:text-gray-300 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical size={16} />
        </button>

        {/* Checkbox-style Complete Button */}
        <button
          onClick={() => onComplete(task._id)}
          className="w-6 h-6 rounded-full border-2 border-gray-600 hover:border-primary flex items-center justify-center transition-all group/check hover:scale-110 active:scale-95"
          title="Mark as Completed"
        >
          <Check size={14} className="text-primary opacity-0 group-hover/check:opacity-100 transition-opacity" strokeWidth={4} />
        </button>

        {/* Task Title */}
        <span className="font-medium text-base text-gray-200 truncate group-hover:text-white transition-colors">
          {task.title}
        </span>
      </div>

      {/* Remove Button */}
      <button
        onClick={() => onRemoveMIT(task._id)}
        className="p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 rounded-lg"
        title="Remove from Daily Non-Negotiables"
      >
        <X size={16} />
      </button>
    </div>
  );
};
