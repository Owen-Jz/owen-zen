import { Play, Pause, Clock, Calendar, Trash2, Square } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TimeLog, ActiveTimer } from "@/types";

interface TimeTrackerProps {
  taskId: string;
  activeTimer?: ActiveTimer;
  totalTimeSpent: number;
  timeLogs?: TimeLog[];
  onStart: (sessionTitle?: string) => void;
  onStop: (note?: string) => void;
  onPause?: () => void;
  onResume?: () => void;
  onDeleteLog?: (logIndex: number) => void;
}

export const TimeTracker = ({ taskId, activeTimer, totalTimeSpent, timeLogs = [], onStart, onStop, onPause, onResume, onDeleteLog }: TimeTrackerProps) => {
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
        setCurrentTime((activeTimer.accumulatedTime || 0) + elapsed);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCurrentTime(activeTimer?.accumulatedTime || 0);
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

  const formatDate = (startedAt: string, endedAt?: string) => {
    const startDate = new Date(startedAt);
    const endDate = endedAt ? new Date(endedAt) : null;
    const now = new Date();

    const isToday = startDate.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = startDate.toDateString() === yesterday.toDateString();

    let dateStr = '';
    if (isToday) dateStr = 'Today';
    else if (isYesterday) dateStr = 'Yesterday';
    else dateStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: startDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });

    const timeStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    if (endDate) {
      const endTimeStr = endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return `${dateStr} • ${timeStr} - ${endTimeStr}`;
    }

    return `${dateStr} • ${timeStr}`;
  };

  const handleStartClick = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    setSessionTitle(dateStr);
    setShowStartModal(true);
  };

  const handleStart = () => {
    onStart(sessionTitle.trim() || undefined);
    setShowStartModal(false);
    setSessionTitle("");
  };

  const handleStop = () => {
    // Use the title from when timer started, or let user override
    const finalTitle = sessionTitle.trim() || activeTimer?.sessionTitle || "";
    const fullNote = finalTitle
      ? `${finalTitle}${note.trim() ? ` - ${note.trim()}` : ''}`
      : note.trim();
    onStop(fullNote || undefined);
    setShowStopModal(false);
    setNote("");
    setSessionTitle("");
  };

  // Pre-fill stop modal with session title from start
  useEffect(() => {
    if (showStopModal && activeTimer?.sessionTitle) {
      setSessionTitle(activeTimer.sessionTitle);
    }
  }, [showStopModal, activeTimer?.sessionTitle]);

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPause && onPause()}
              className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 text-yellow-500 rounded-lg hover:bg-yellow-500/30 transition-all text-sm font-medium"
            >
              <Pause size={14} /> Pause
            </button>
            <button
              onClick={() => setShowStopModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-all text-sm font-medium"
            >
              <Square size={14} /> Stop
            </button>
          </div>
        ) : activeTimer?.accumulatedTime !== undefined && activeTimer.accumulatedTime > 0 ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onResume && onResume()}
              className="flex items-center gap-2 px-3 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-all text-sm font-medium"
            >
              <Play size={14} /> Continue
            </button>
            <button
              onClick={() => setShowStopModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-all text-sm font-medium"
            >
              <Square size={14} /> Stop
            </button>
          </div>
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
            {timeLogs.slice().reverse().map((log, i) => {
              const actualIndex = timeLogs.length - 1 - i; // Reverse index for deletion
              const startDate = new Date(log.startedAt);
              const endDate = log.endedAt ? new Date(log.endedAt) : null;

              return (
                <div key={i} className="p-3 bg-surface rounded-lg border border-border group hover:border-primary/30 transition-all">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 space-y-2">
                      {/* Date and Duration */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Calendar size={12} />
                          <span>{formatDate(log.startedAt, log.endedAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary text-sm tabular-nums">{formatTime(log.duration)}</span>
                        </div>
                      </div>

                      {/* Session Note/Title */}
                      {log.note ? (
                        <div className="text-sm text-white font-medium bg-background/50 px-3 py-2 rounded-lg border border-border/50">
                          {log.note}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 italic px-2">No description</div>
                      )}
                    </div>

                    {/* Delete Button */}
                    {onDeleteLog && (
                      <button
                        onClick={() => onDeleteLog(actualIndex)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-all shrink-0"
                        title="Delete session"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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
                  onFocus={(e) => e.target.select()}
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
