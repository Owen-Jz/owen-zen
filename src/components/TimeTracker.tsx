import { Play, Pause, Clock, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TimeLog {
  startedAt: string;
  endedAt?: string;
  duration: number;
  note?: string;
}

interface TimeTrackerProps {
  taskId: string;
  activeTimer?: { startedAt?: string; isActive: boolean };
  totalTimeSpent: number;
  timeLogs?: TimeLog[];
  onStart: () => void;
  onStop: (note?: string) => void;
}

export const TimeTracker = ({ taskId, activeTimer, totalTimeSpent, timeLogs = [], onStart, onStop }: TimeTrackerProps) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [showStopModal, setShowStopModal] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [note, setNote] = useState("");
  const [sessionTitle, setSessionTitle] = useState("");
  const [showLogs, setShowLogs] = useState(false);

  // Update timer every second when active
  useEffect(() => {
    if (activeTimer?.isActive && activeTimer.startedAt) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(activeTimer.startedAt!).getTime()) / 1000);
        setCurrentTime(elapsed);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCurrentTime(0);
    }
  }, [activeTimer]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return `Yesterday ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const handleStartClick = () => {
    setShowStartModal(true);
  };

  const handleStart = () => {
    onStart();
    setShowStartModal(false);
    setSessionTitle("");
  };

  const handleStop = () => {
    const fullNote = sessionTitle.trim() 
      ? `${sessionTitle.trim()}${note.trim() ? ` - ${note.trim()}` : ''}`
      : note.trim();
    onStop(fullNote || undefined);
    setShowStopModal(false);
    setNote("");
    setSessionTitle("");
  };

  return (
    <div className="space-y-3">
      {/* Timer Control */}
      <div className="flex items-center justify-between p-3 bg-surface-hover rounded-lg border border-border">
        <div className="flex items-center gap-3">
          <Clock size={16} className="text-gray-400" />
          <div>
            <div className="text-sm font-bold">
              {activeTimer?.isActive ? formatTime(currentTime) : formatTime(totalTimeSpent || 0)}
            </div>
            <div className="text-[10px] text-gray-500 uppercase">
              {activeTimer?.isActive ? "Running..." : "Total Time"}
            </div>
          </div>
        </div>

        {activeTimer?.isActive ? (
          <button
            onClick={() => setShowStopModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-all text-sm font-medium"
          >
            <Pause size={14} /> Stop
          </button>
        ) : (
          <button
            onClick={handleStartClick}
            className="flex items-center gap-2 px-3 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-all text-sm font-medium"
          >
            <Play size={14} /> Start
          </button>
        )}
      </div>

      {/* Time Logs Toggle */}
      {timeLogs.length > 0 && (
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-white transition-colors"
        >
          {showLogs ? "Hide" : "View"} {timeLogs.length} session{timeLogs.length !== 1 ? "s" : ""}
        </button>
      )}

      {/* Time Logs List */}
      <AnimatePresence>
        {showLogs && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {timeLogs.slice().reverse().map((log, i) => (
              <div key={i} className="p-3 bg-surface rounded-lg border border-border">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar size={12} />
                    <span>{formatDate(log.startedAt)}</span>
                  </div>
                  <span className="font-bold text-primary text-sm">{formatTime(log.duration)}</span>
                </div>
                {log.note && <div className="text-sm text-gray-300 font-medium mt-1">"{log.note}"</div>}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start Modal */}
      <AnimatePresence>
        {showStartModal && (
          <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold mb-4">Start Timer</h3>
              <div className="mb-6">
                <label className="text-xs uppercase text-gray-500 font-bold mb-2 block">
                  What will you work on?
                </label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="e.g., Fix login bug, Design homepage, Review PRs..."
                  className="w-full bg-background border border-border rounded-xl p-3 focus:border-primary outline-none text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleStart();
                  }}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Optional: Describe this work session so you remember what you did
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowStartModal(false);
                    setSessionTitle("");
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-border text-gray-400 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStart}
                  className="flex-1 px-4 py-3 rounded-xl bg-primary text-white hover:brightness-110 transition-all font-medium"
                >
                  Start Timer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stop Modal */}
      <AnimatePresence>
        {showStopModal && (
          <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold mb-4">Stop Timer</h3>
              <div className="mb-4">
                <div className="text-center py-6">
                  <div className="text-4xl font-bold text-primary mb-2">{formatTime(currentTime)}</div>
                  <div className="text-sm text-gray-400">Session Duration</div>
                </div>
              </div>
              <div className="mb-6 space-y-4">
                <div>
                  <label className="text-xs uppercase text-gray-500 font-bold mb-2 block">
                    What did you work on? (Required)
                  </label>
                  <input
                    type="text"
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    placeholder="e.g., Fixed authentication bug"
                    className="w-full bg-background border border-border rounded-xl p-3 focus:border-primary outline-none text-sm"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs uppercase text-gray-500 font-bold mb-2 block">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Any extra details or context..."
                    className="w-full bg-background border border-border rounded-xl p-3 focus:border-primary outline-none min-h-[60px] resize-none text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowStopModal(false);
                    setNote("");
                    setSessionTitle("");
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-border text-gray-400 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStop}
                  disabled={!sessionTitle.trim()}
                  className="flex-1 px-4 py-3 rounded-xl bg-primary text-white hover:brightness-110 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Stop & Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
