"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, X } from "lucide-react";
import { DndContext, useDraggable, useDroppable, DragOverlay } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Reusing types
interface Task {
  _id: string;
  title: string;
  status: string;
  priority: string;
  scheduledDate?: string;
}

// Draggable Task Component
const DraggableTask = ({ task }: { task: Task }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task._id,
    data: { task }
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-surface border border-border p-3 rounded-lg mb-2 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-all text-sm group"
    >
      <div className="font-medium truncate">{task.title}</div>
      <div className="flex justify-between mt-1">
        <span className={cn(
          "text-[10px] uppercase font-bold",
          task.priority === 'high' ? "text-red-500" : "text-gray-500"
        )}>
          {task.priority}
        </span>
      </div>
    </div>
  );
};

// Droppable Day Cell
const CalendarDay = ({ date, tasks, isToday, onDrop }: any) => {
  const dateStr = date.toISOString().split('T')[0];
  const { setNodeRef, isOver } = useDroppable({
    id: dateStr,
    data: { date: dateStr } // Pass date string as drop data
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[150px] bg-surface/30 border border-border p-2 transition-all flex flex-col",
        isToday && "bg-primary/5 border-primary/30",
        isOver && "bg-primary/10 ring-2 ring-primary inset-0 z-10"
      )}
    >
      <div className={cn("text-right text-sm font-mono mb-2", isToday ? "text-primary font-bold" : "text-gray-500")}>
        {date.getDate()}
      </div>
      <div className="flex-1 space-y-1">
        {tasks.map((task: Task) => (
          <div key={task._id} className="bg-primary/20 text-primary border border-primary/30 p-1.5 rounded text-xs truncate">
             {task.title}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      const json = await res.json();
      if (json.success) setTasks(json.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Calendar Logic
  const getDaysInWeek = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay()); // Sunday
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getDaysInWeek(currentDate);

  const handleDragStart = (event: any) => {
    setActiveDragTask(event.active.data.current?.task);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveDragTask(null);

    if (over && active) {
      const dateStr = over.id; // The drop target ID is the YYYY-MM-DD string
      const taskId = active.id;

      // Optimistic update
      const updatedTasks = tasks.map(t => 
        t._id === taskId ? { ...t, scheduledDate: dateStr } : t
      );
      setTasks(updatedTasks);

      // API Sync
      try {
        // We'll assume 9:00 AM for drag-drop scheduling
        const targetDate = new Date(dateStr);
        targetDate.setHours(9, 0, 0, 0);

        await fetch('/api/calendar/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, date: targetDate.toISOString() })
        });
        
        // Refresh to confirm/get google IDs
        fetchTasks();
      } catch (error) {
        console.error("Sync failed", error);
        // Revert? For now just log
      }
    }
  };

  // Filter tasks
  const unscheduledTasks = tasks.filter(t => !t.scheduledDate && t.status !== 'completed');
  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(t => t.scheduledDate && t.scheduledDate.startsWith(dateStr));
  };

  const nextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  const prevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentDate(prev);
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-140px)] flex gap-6 animate-in fade-in duration-500">
        
        {/* Sidebar: Unscheduled Tasks */}
        <div className="w-80 flex flex-col bg-surface/30 border border-border rounded-xl overflow-hidden shrink-0">
          <div className="p-4 border-b border-border bg-surface/50 backdrop-blur-sm">
            <h3 className="font-bold text-gray-200 flex items-center gap-2">
              <Clock size={16} /> Unscheduled
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {unscheduledTasks.map(task => (
              <DraggableTask key={task._id} task={task} />
            ))}
            {unscheduledTasks.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-10">All active tasks scheduled!</div>
            )}
          </div>
        </div>

        {/* Main Calendar Grid */}
        <div className="flex-1 flex flex-col bg-surface/30 border border-border rounded-xl overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-border flex justify-between items-center bg-surface/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-white">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-1">
                <button onClick={prevWeek} className="p-1 hover:bg-white/10 rounded"><ChevronLeft size={20} /></button>
                <button onClick={() => setCurrentDate(new Date())} className="text-xs px-2 hover:bg-white/10 rounded border border-transparent hover:border-border transition-all">Today</button>
                <button onClick={nextWeek} className="p-1 hover:bg-white/10 rounded"><ChevronRight size={20} /></button>
              </div>
            </div>
          </div>

          {/* Grid Header */}
          <div className="grid grid-cols-7 border-b border-border bg-surface/20">
            {weekDays.map((d, i) => (
              <div key={i} className="p-3 text-center text-xs font-bold uppercase text-gray-500 border-r border-border last:border-r-0">
                {d.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
            ))}
          </div>

          {/* Grid Body */}
          <div className="grid grid-cols-7 flex-1">
            {weekDays.map((d, i) => {
              const isToday = d.toDateString() === new Date().toDateString();
              return (
                <div key={i} className="border-r border-border last:border-r-0 h-full">
                   <CalendarDay 
                     date={d} 
                     tasks={getTasksForDate(d)} 
                     isToday={isToday} 
                   />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <DragOverlay>
        {activeDragTask ? (
            <div className="bg-surface border border-primary p-3 rounded-lg shadow-2xl w-64 rotate-3 cursor-grabbing opacity-90">
                <div className="font-medium text-white">{activeDragTask.title}</div>
            </div>
        ) : null}
      </DragOverlay>

    </DndContext>
  );
};
