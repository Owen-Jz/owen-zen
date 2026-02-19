import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Timer, Play, Pause, Maximize2, Minimize2, CheckCircle2 } from "lucide-react";
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
  onCompleteTask: (taskId: string) => void;
}

export const FocusOverlay = ({
  task,
  onClose,
  onToggleSubtask,
  onStartTimer,
  onStopTimer,
  onCompleteTask
}: FocusOverlayProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionTitle, setSessionTitle] = useState("");
  const [showStopModal, setShowStopModal] = useState(false);
  const [stopNote, setStopNote] = useState("");

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
      className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 md:p-12"
    >
      {/* Top Bar */}
      <div className="absolute top-6 right-6 flex items-center gap-4">
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
            "text-[8rem] md:text-[10rem] font-black tabular-nums tracking-tighter leading-none transition-colors duration-500",
            task.activeTimer?.isActive ? "text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]" : "text-gray-800"
          )}>
            {task.activeTimer?.isActive ? formatTime(elapsedTime) : formatTime(task.totalTimeSpent || 0)}
          </div>

          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {!task.activeTimer?.isActive ? (
              <button
                onClick={() => {
                  const now = new Date();
                  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
                  onStartTimer(task._id, dateStr);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-bold text-lg hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
              >
                <Play size={20} fill="currentColor" /> Start Focus
              </button>
            ) : (
              <button
                onClick={() => setShowStopModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-red-500/20 text-red-500 border border-red-500/50 rounded-full font-bold text-lg hover:bg-red-500 hover:text-white transition-all"
              >
                <Pause size={20} fill="currentColor" /> Pause
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
            <div className="bg-surface/50 border border-border rounded-2xl p-6 text-left max-h-[40vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Subtasks</span>
                <span className="text-xs font-mono text-gray-500">{completedSubtasks}/{totalSubtasks}</span>
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
