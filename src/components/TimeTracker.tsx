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
  const [note, setNote] = useState("");
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleStop = () => {
    onStop(note.trim() || undefined);
    setShowStopModal(false);
    setNote("");
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
            onClick={onStart}
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
              <div key={i} className="p-2 bg-surface rounded-lg border border-border text-xs">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-gray-400">{formatDate(log.startedAt)}</span>
                  <span className="font-bold text-primary">{formatTime(log.duration)}</span>
                </div>
                {log.note && <div className="text-gray-500 text-[10px] italic">"{log.note}"</div>}
              </div>
            ))}
          </motion.div>
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
              <div className="mb-6">
                <label className="text-xs uppercase text-gray-500 font-bold mb-2 block">
                  Add Note (Optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What did you accomplish?"
                  className="w-full bg-background border border-border rounded-xl p-3 focus:border-primary outline-none min-h-[80px] resize-none text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowStopModal(false);
                    setNote("");
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-border text-gray-400 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStop}
                  className="flex-1 px-4 py-3 rounded-xl bg-primary text-white hover:brightness-110 transition-all font-medium"
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
