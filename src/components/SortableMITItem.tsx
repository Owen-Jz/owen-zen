"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, X, GripVertical } from "lucide-react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface Task {
  _id: string;
  title: string;
  isMIT: boolean;
  order: number;
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
        "card-glass p-5 flex items-center justify-between group transition-all shadow-md hover:shadow-xl hover:bg-surface/80 border-white/5",
        isDragging && "opacity-80 ring-2 ring-primary z-50 scale-105 shadow-2xl"
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
