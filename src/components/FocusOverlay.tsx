import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Play, Pause, Minimize2, CheckCircle2, AlignLeft, ChevronDown, ChevronUp, Circle } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Reusing types from parent context if possible, otherwise redefining locally for the component
interface SubTask {
  title: string;
  completed: boolean;
}

interface ActiveTimer {
  startedAt?: string;
  isActive: boolean;
  sessionTitle?: string;
}

interface Task {
  _id: string;
  title: string;
  status: string;
  priority: string;
  subtasks?: SubTask[];
  activeTimer?: ActiveTimer;
  totalTimeSpent?: number;
}

interface FocusOverlayProps {
  task: Task;
  onClose: () => void;
  onToggleSubtask: (taskId: string, index: number) => void;
  onStartTimer: (taskId: string, sessionTitle?: string) => void;
  onStopTimer: (taskId: string, note?: string) => void;
  onCompleteTask: (id: string) => void;
}

export const FocusOverlay = ({
  task,
  onClose,
  onToggleSubtask,
  onStartTimer,
  onStopTimer,
  onCompleteTask,
}: FocusOverlayProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionTitle, setSessionTitle] = useState("");
  const [showStopModal, setShowStopModal] = useState(false);
  const [stopNote, setStopNote] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [quickNotes, setQuickNotes] = useState("");

  // Timer logic
  useEffect(() => {
    if (!task.activeTimer?.isActive) {
      setElapsedTime(0);
      return;
    }

    const calculateTime = () => {
      const start = new Date(task.activeTimer!.startedAt!).getTime();
      const now = Date.now();
      setElapsedTime(Math.floor((now - start) / 1000));
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [task.activeTimer]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStop = () => {
    const sessionTitle = task.activeTimer?.sessionTitle || "";
    const fullNote = sessionTitle
      ? `${sessionTitle}${stopNote.trim() ? ` - ${stopNote.trim()}` : ''}`
      : stopNote.trim();
    onStopTimer(task._id, fullNote);
    setShowStopModal(false);
    setStopNote("");
  };

  // Progress calculation
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const progress = totalSubtasks === 0 ? 0 : (completedSubtasks / totalSubtasks) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden"
    >
      {/* Atmospheric Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-[400px] h-[400px] bg-purple-500/3 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '4s' }} />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>
      {/* Top Bar */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
        <button
          onClick={onClose}
          className="p-3 rounded-full bg-surface border border-border text-gray-400 hover:text-white hover:bg-surface-hover transition-all group"
          title="Exit Focus Mode"
        >
          <Minimize2 size={24} className="group-hover:scale-90 transition-transform" />
        </button>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-3xl flex flex-col items-center gap-12 text-center">

        {/* Timer Display */}
        <div className="relative group">
          <div className={cn(
            "text-[8rem] md:text-[10rem] font-black tabular-nums tracking-tighter leading-none transition-all duration-500",
            task.activeTimer?.isActive
              ? "text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]"
              : "text-white/20"
          )}>
            {task.activeTimer?.isActive ? formatTime(elapsedTime) : formatTime(task.totalTimeSpent || 0)}
          </div>

          {/* Progress Ring */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10">
            <svg className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-white/5"
              />
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={283 * 2}
                strokeDashoffset={283 * 2 - (progress / 100) * 283 * 2}
                className={cn(
                  "transition-all duration-700",
                  task.activeTimer?.isActive ? "text-primary drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]" : "text-white/20"
                )}
              />
            </svg>
          </div>

          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {!task.activeTimer?.isActive ? (
              <button
                onClick={() => {
                  const now = new Date();
                  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
                  onStartTimer(task._id, dateStr);
                }}
                className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-full font-bold text-lg hover:brightness-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:shadow-[0_0_50px_rgba(220,38,38,0.6)]"
              >
                <Play size={22} fill="currentColor" /> Start Focus
              </button>
            ) : (
              <button
                onClick={() => setShowStopModal(true)}
                className="flex items-center gap-2 px-8 py-4 bg-white/10 text-white border border-white/20 rounded-full font-bold text-lg hover:bg-white/20 hover:border-white/30 transition-all backdrop-blur-sm"
              >
                <Pause size={20} fill="currentColor" /> End Session
              </button>
            )}
          </div>
        </div>

        {/* Task Info */}
        <div className="space-y-6 max-w-2xl w-full">
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl md:text-5xl font-bold text-gray-200 leading-tight"
          >
            {task.title}
          </motion.h2>

          {/* Subtasks List */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="bg-surface/30 border border-white/5 rounded-2xl p-6 text-left max-h-[40vh] overflow-y-auto custom-scrollbar backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                  <Circle size={12} className={cn("fill-current", progress === 100 ? "text-green-500" : "text-gray-500")} />
                  Subtasks
                </span>
                <span className={cn(
                  "text-xs font-mono px-2 py-1 rounded-full",
                  progress === 100 ? "bg-green-500/20 text-green-500" : "bg-white/10 text-gray-400"
                )}>
                  {completedSubtasks}/{totalSubtasks}
                  {progress === 100 && " ✓"}
                </span>
              </div>
              <div className="space-y-3">
                {task.subtasks.map((st, i) => (
                  <motion.div
                    key={i}
                    layout
                    onClick={() => onToggleSubtask(task._id, i)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border",
                      st.completed
                        ? "bg-primary/5 border-primary/20 opacity-60"
                        : "bg-background border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                      st.completed ? "bg-primary border-primary" : "border-gray-600 group-hover:border-primary"
                    )}>
                      {st.completed && <Check size={14} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className={cn(
                      "text-lg font-medium transition-all",
                      st.completed ? "text-gray-500 line-through" : "text-white"
                    )}>
                      {st.title}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Notes - Collapsible */}
          <div className="bg-surface/30 border border-white/5 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <AlignLeft size={14} /> Quick Notes
                {quickNotes && <span className="w-2 h-2 bg-primary rounded-full ml-2" />}
              </span>
              {showNotes ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
            </button>
            <AnimatePresence>
              {showNotes && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <textarea
                    value={quickNotes}
                    onChange={(e) => setQuickNotes(e.target.value)}
                    placeholder="Jot down quick notes while you focus..."
                    className="w-full bg-transparent border-t border-white/5 p-4 focus:border-primary/50 outline-none min-h-[120px] resize-none text-gray-300 placeholder-gray-600 scrollbar-thin scrollbar-thumb-white/10"
                    autoFocus={showNotes}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Complete Task Button */}
          <button
            onClick={() => {
              onCompleteTask(task._id);
              onClose();
            }}
            className="text-gray-500 hover:text-primary transition-colors text-sm font-medium flex items-center justify-center gap-2 mx-auto mt-8"
          >
            <CheckCircle2 size={18} /> Mark Task as Done & Exit
          </button>
        </div>
      </div>

      {/* Stop Session Modal */}
      <AnimatePresence>
        {showStopModal && (
          <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-4">Session Summary</h3>
              <div className="mb-6">
                <label className="text-xs uppercase text-gray-500 font-bold mb-2 block">
                  What did you accomplish?
                </label>
                <textarea
                  value={stopNote}
                  onChange={(e) => setStopNote(e.target.value)}
                  placeholder="e.g. Completed the backend API..."
                  className="w-full bg-background border border-border rounded-xl p-4 focus:border-primary outline-none min-h-[100px] resize-none"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowStopModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-border text-gray-400 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStop}
                  className="flex-1 px-4 py-3 rounded-xl bg-primary text-white hover:brightness-110 transition-all font-medium"
                >
                  Save & Stop
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
