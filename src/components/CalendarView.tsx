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
const CalendarDay = ({ date, tasks, isToday, onDrop, isCurrentMonth }: any) => {
  const dateStr = date.toISOString().split('T')[0];
  const { setNodeRef, isOver } = useDroppable({
    id: dateStr,
    data: { date: dateStr } // Pass date string as drop data
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[100px] border border-border/30 p-2 transition-all flex flex-col hover:bg-surface/10",
        isToday && "bg-primary/5 ring-1 ring-primary/30",
        isOver && "bg-primary/10 ring-2 ring-primary inset-0 z-10",
        !isCurrentMonth && "opacity-30 grayscale bg-black/20"
      )}
    >
      <div className={cn("text-right text-xs font-mono mb-1", isToday ? "text-primary font-bold" : "text-gray-500")}>
        {date.getDate()}
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
        {tasks.map((task: Task) => (
          <div key={task._id} className="bg-primary/20 text-primary border border-primary/30 p-1 rounded text-[10px] truncate cursor-pointer hover:bg-primary/30">
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

  // Calendar Logic (Monthly)
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start date for the grid (go back to Sunday)
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    // End date for the grid (go forward to Saturday to complete the grid)
    const endDate = new Date(lastDay);
    if (endDate.getDay() !== 6) {
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    }
    
    const days = [];
    let current = new Date(startDate);
    
    // Ensure we always show 6 weeks (42 days) to keep grid stable
    // Or just loop until > endDate
    while (current <= endDate || days.length % 7 !== 0) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = getDaysInMonth(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleDragStart = (event: any) => {
    setActiveDragTask(event.active.data.current?.task);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveDragTask(null);

    if (over && active) {
      const dateStr = over.id; // YYYY-MM-DD string
      const taskId = active.id;
      const task = active.data.current?.task;

      console.log(`Dragging task ${taskId} to date ${dateStr}`);

      // 1. Optimistic update
      const updatedTasks = tasks.map(t => 
        t._id === taskId ? { ...t, scheduledDate: dateStr } : t
      );
      setTasks(updatedTasks);

      // 2. API Sync
      try {
        // We'll assume 9:00 AM for drag-drop scheduling
        const targetDate = new Date(dateStr);
        targetDate.setHours(9, 0, 0, 0);

        const res = await fetch('/api/calendar/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, date: targetDate.toISOString() })
        });
        
        if (!res.ok) {
            throw new Error('Failed to sync calendar');
        }

        const json = await res.json();
        console.log('Calendar sync success:', json);
        
        // No need to full refetch if optimistic update was correct, 
        // but getting the googleEventId back is good practice eventually.
        // For now, let's keep it snappy.
        
      } catch (error) {
        console.error("Sync failed", error);
        // Revert on failure
        // setTasks(tasks); // Revert to previous state
        alert("Failed to schedule task. Please try again.");
        fetchTasks(); // Hard refresh to sync state
      }
    }
  };

  // Filter tasks
  const unscheduledTasks = tasks.filter(t => !t.scheduledDate && t.status !== 'completed');
  
  const getTasksForDate = (date: Date) => {
    // Robust date comparison
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(t => {
        if (!t.scheduledDate) return false;
        // Handle ISO strings from DB which might be full timestamps
        const tDate = new Date(t.scheduledDate).toISOString().split('T')[0];
        return tDate === dateStr;
    });
  };

  const nextMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  const prevMonth = () => {
    const prev = new Date(currentDate);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentDate(prev);
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-140px)] flex gap-6 animate-in fade-in duration-500">
        
        {/* Sidebar: Unscheduled Tasks */}
        <div className="w-64 flex flex-col bg-surface/30 border border-border rounded-xl overflow-hidden shrink-0">
          <div className="p-4 border-b border-border bg-surface/50 backdrop-blur-sm">
            <h3 className="font-bold text-gray-200 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Clock size={14} /> Backlog
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-2">
            {unscheduledTasks.map(task => (
              <DraggableTask key={task._id} task={task} />
            ))}
            {unscheduledTasks.length === 0 && (
              <div className="text-center text-gray-500 text-xs py-10">All active tasks scheduled!</div>
            )}
          </div>
        </div>

        {/* Main Calendar Grid */}
        <div className="flex-1 flex flex-col bg-surface/10 border border-border rounded-xl overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-border flex justify-between items-center bg-surface/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-1 items-center bg-surface border border-border rounded-lg p-1">
                <button onClick={prevMonth} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"><ChevronLeft size={18} /></button>
                <button onClick={() => setCurrentDate(new Date())} className="text-xs font-bold uppercase px-3 py-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-all">Today</button>
                <button onClick={nextMonth} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"><ChevronRight size={18} /></button>
              </div>
            </div>
            <div className="text-xs text-gray-500 font-mono">
                {tasks.filter(t => t.scheduledDate).length} Scheduled
            </div>
          </div>

          {/* Grid Header */}
          <div className="grid grid-cols-7 border-b border-border bg-surface/30">
            {weekDays.map((day, i) => (
              <div key={i} className="py-3 text-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Grid Body */}
          <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-black/20">
            {calendarDays.map((d, i) => {
              const isToday = d.toDateString() === new Date().toDateString();
              const isCurrentMonth = d.getMonth() === currentDate.getMonth();
              
              return (
                 <CalendarDay 
                   key={i}
                   date={d} 
                   tasks={getTasksForDate(d)} 
                   isToday={isToday}
                   isCurrentMonth={isCurrentMonth}
                 />
              );
            })}
          </div>
        </div>
      </div>
      
      <DragOverlay>
        {activeDragTask ? (
            <div className="bg-surface border border-primary p-3 rounded-lg shadow-2xl w-56 rotate-2 cursor-grabbing opacity-90 backdrop-blur-md">
                <div className="font-medium text-white text-sm">{activeDragTask.title}</div>
            </div>
        ) : null}
      </DragOverlay>

    </DndContext>
  );
};
