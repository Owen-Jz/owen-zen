"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Coffee, Brain, Clock, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSound } from "@/components/SoundEffects";

type TimerMode = "focus" | "shortBreak" | "longBreak";
type WidgetMode = "pomodoro" | "dailyTrack";

const WORK_TIME = 25 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;
const DEEP_WORK_SECONDS = 4 * 60 * 60; // 4 hours

interface SessionHistory {
  startedAt: string;
  endedAt: string | null;
  duration: number;
}

interface DailyTrackState {
  accumulatedSeconds: number;
  sessionHistory: SessionHistory[];
  deepWorkHabitId: string | null;
  lastResetDate: string | null;
  autoCompleteTriggered: boolean;
  currentSessionStart: string | null;
}

interface PomodoroState {
  mode: TimerMode;
  timerMode: WidgetMode;
  timeLeft: number;
  isRunning: boolean;
  sessions: number;
  startedAt: string | null;
  dailyTrack: DailyTrackState;
}

const getToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

export const PomodoroWidget = () => {
  const [widgetMode, setWidgetMode] = useState<WidgetMode>("pomodoro");
  const [mode, setMode] = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Daily Track state
  const [dailyTrack, setDailyTrack] = useState<DailyTrackState>({
    accumulatedSeconds: 0,
    sessionHistory: [],
    deepWorkHabitId: null,
    lastResetDate: null,
    autoCompleteTriggered: false,
    currentSessionStart: null,
  });
  const [currentSeconds, setCurrentSeconds] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { playAlarm } = useSound();

  const getTimeForMode = (m: TimerMode) => {
    switch (m) {
      case "focus": return WORK_TIME;
      case "shortBreak": return SHORT_BREAK;
      case "longBreak": return LONG_BREAK;
    }
  };

  // Load state on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const res = await fetch("/api/pomodoro");
        const data = await res.json();
        if (data.success && data.data) {
          const state = data.data as PomodoroState;

          // Check if we need to reset daily track for a new day
          const today = getToday();
          const savedDate = state.dailyTrack?.lastResetDate;
          let finalDailyTrack = state.dailyTrack || {};

          if (savedDate !== today) {
            finalDailyTrack = {
              accumulatedSeconds: 0,
              sessionHistory: [],
              deepWorkHabitId: state.dailyTrack?.deepWorkHabitId || null,
              lastResetDate: today,
              autoCompleteTriggered: false,
              currentSessionStart: null,
            };
          }

          setWidgetMode(state.timerMode || "pomodoro");
          setMode(state.mode || "focus");
          setSessions(state.sessions || 0);
          setDailyTrack(finalDailyTrack);

          if (state.isRunning && state.startedAt) {
            const elapsed = Math.floor((Date.now() - new Date(state.startedAt).getTime()) / 1000);
            if (state.timerMode === "pomodoro") {
              setTimeLeft(Math.max(0, state.timeLeft - elapsed));
              setIsRunning(true);
            } else if (state.timerMode === "dailyTrack") {
              // Resume daily track: add elapsed to previously accumulated time
              const prevAccumulated = state.dailyTrack?.accumulatedSeconds || 0;
              setCurrentSeconds(prevAccumulated + Math.floor(elapsed));
              setIsRunning(true);
            }
          } else {
            if (state.timerMode === "pomodoro") {
              setTimeLeft(state.timeLeft || getTimeForMode(state.mode || "focus"));
            } else {
              setCurrentSeconds(state.dailyTrack?.accumulatedSeconds || 0);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load pomodoro state:", error);
      }
      setIsLoaded(true);
    };
    loadState();
  }, []);

  // Persist state to DB
  const persistState = useCallback(async (updates: Partial<PomodoroState>) => {
    try {
      await fetch("/api/pomodoro", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error("Failed to save pomodoro state:", error);
    }
  }, []);

  // Refs for functions used in effects to avoid dependency churn
  const persistStateRef = useRef(persistState);
  useEffect(() => { persistStateRef.current = persistState; }, [persistState]);

  // Pomodoro timer tick
  useEffect(() => {
    if (widgetMode !== "pomodoro" || !isRunning || timeLeft <= 0) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, widgetMode, timeLeft]);

  // Handle pomodoro completion
  useEffect(() => {
    if (widgetMode !== "pomodoro" || timeLeft !== 0 || !isLoaded) return;

    setIsRunning(false);
    playAlarm();
    if (mode === "focus") {
      setSessions((prev) => prev + 1);
    }
    persistStateRef.current({
      isRunning: false,
      timeLeft: getTimeForMode(mode),
      sessions: mode === "focus" ? sessions + 1 : sessions,
      startedAt: null,
    });
  }, [timeLeft, isLoaded, mode, sessions, widgetMode]);

  // Daily track tick
  useEffect(() => {
    if (widgetMode !== "dailyTrack" || !isRunning) return;

    intervalRef.current = setInterval(() => {
      setCurrentSeconds((prev) => prev + 1);
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [widgetMode, isRunning]);

  // Auto-complete deep work when 4hr threshold crossed
  const triggerDeepWorkCompleteRef = useRef<(() => Promise<void>) | undefined>(undefined);

  const triggerDeepWorkComplete = useCallback(async () => {
    if (!dailyTrack.deepWorkHabitId) return;

    try {
      await fetch(`/api/habits/${dailyTrack.deepWorkHabitId}/complete`, { method: "POST" });
      const updated: DailyTrackState = {
        ...dailyTrack,
        autoCompleteTriggered: true,
      };
      setDailyTrack(updated);
      persistStateRef.current({ dailyTrack: updated, timerMode: "dailyTrack" });
    } catch (error) {
      console.error("Failed to auto-complete deep work habit:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyTrack.deepWorkHabitId]);

  useEffect(() => { triggerDeepWorkCompleteRef.current = triggerDeepWorkComplete; }, [triggerDeepWorkComplete]);

  useEffect(() => {
    if (widgetMode !== "dailyTrack") return;
    if (dailyTrack.autoCompleteTriggered) return;

    const totalSeconds = dailyTrack.accumulatedSeconds + currentSeconds;
    if (totalSeconds >= DEEP_WORK_SECONDS && dailyTrack.deepWorkHabitId) {
      triggerDeepWorkCompleteRef.current?.();
    }
  }, [currentSeconds, dailyTrack, widgetMode, triggerDeepWorkComplete]);

  // Check for day change while app is open — reset if new day
  useEffect(() => {
    if (widgetMode !== "dailyTrack") return;

    const checkDayChange = () => {
      const today = getToday();
      if (dailyTrack.lastResetDate && dailyTrack.lastResetDate !== today) {
        const resetTrack: DailyTrackState = {
          ...dailyTrack,
          accumulatedSeconds: 0,
          sessionHistory: [],
          lastResetDate: today,
          autoCompleteTriggered: false,
          currentSessionStart: null,
        };
        setDailyTrack(resetTrack);
        setCurrentSeconds(0);
        setIsRunning(false);
        persistStateRef.current({ dailyTrack: resetTrack, timerMode: "dailyTrack", isRunning: false });
      }
    };

    // Check every minute for day change
    const interval = setInterval(checkDayChange, 60 * 1000);
    return () => clearInterval(interval);
  }, [widgetMode, dailyTrack]);

  const handlePauseDailyTrack = async () => {
    const sessionStart = dailyTrack.currentSessionStart;
    const sessionDuration = sessionStart
      ? Math.floor((Date.now() - new Date(sessionStart).getTime()) / 1000)
      : currentSeconds;

    const newAccumulated = dailyTrack.accumulatedSeconds + sessionDuration;

    const newSession: SessionHistory = {
      startedAt: sessionStart || new Date().toISOString(),
      endedAt: new Date().toISOString(),
      duration: sessionDuration,
    };

    const updatedTrack: DailyTrackState = {
      ...dailyTrack,
      accumulatedSeconds: newAccumulated,
      sessionHistory: [...dailyTrack.sessionHistory, newSession],
      currentSessionStart: null,
    };

    // Check auto-complete after pausing
    if (newAccumulated >= DEEP_WORK_SECONDS && !updatedTrack.autoCompleteTriggered && updatedTrack.deepWorkHabitId) {
      try {
        await fetch(`/api/habits/${updatedTrack.deepWorkHabitId}/complete`, { method: "POST" });
        updatedTrack.autoCompleteTriggered = true;
      } catch (error) {
        console.error("Failed to auto-complete deep work habit:", error);
      }
    }

    setDailyTrack(updatedTrack);
    setCurrentSeconds(0);
    setIsRunning(false);
    persistStateRef.current({ dailyTrack: updatedTrack, timerMode: "dailyTrack", isRunning: false });
  };

  const handleStartDailyTrack = () => {
    const now = new Date().toISOString();
    const updatedTrack: DailyTrackState = {
      ...dailyTrack,
      currentSessionStart: now,
    };
    setDailyTrack(updatedTrack);
    setIsRunning(true);
    persistStateRef.current({ dailyTrack: updatedTrack, timerMode: "dailyTrack", isRunning: true, startedAt: now });
  };

  const handleResumeDailyTrack = () => {
    const now = new Date().toISOString();
    const updatedTrack: DailyTrackState = {
      ...dailyTrack,
      currentSessionStart: now,
    };
    setDailyTrack(updatedTrack);
    setIsRunning(true);
    persistStateRef.current({ dailyTrack: updatedTrack, timerMode: "dailyTrack", isRunning: true, startedAt: now });
  };

  const getModeColor = (m: TimerMode) => {
    switch (m) {
      case "focus": return "text-red-500";
      case "shortBreak": return "text-green-500";
      case "longBreak": return "text-blue-500";
    }
  };

  const getModeBg = (m: TimerMode) => {
    switch (m) {
      case "focus": return "bg-red-500/20 border-red-500/30";
      case "shortBreak": return "bg-green-500/20 border-green-500/30";
      case "longBreak": return "bg-blue-500/20 border-blue-500/30";
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatHHMMSS = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    const newTime = getTimeForMode(mode);
    setTimeLeft(newTime);
    persistStateRef.current({
      timeLeft: newTime,
      isRunning: false,
      startedAt: null,
    });
  };

  const switchMode = (m: TimerMode) => {
    setIsRunning(false);
    setMode(m);
    const newTime = getTimeForMode(m);
    setTimeLeft(newTime);
    persistStateRef.current({
      mode: m,
      timeLeft: newTime,
      isRunning: false,
      startedAt: null,
    });
  };

  const switchWidgetMode = (m: WidgetMode) => {
    if (m === widgetMode) return;

    // If switching away from daily track while running, pause and save
    if (widgetMode === "dailyTrack" && isRunning) {
      handlePauseDailyTrack();
    }

    setWidgetMode(m);
    if (m === "pomodoro") {
      setIsRunning(false);
      persistStateRef.current({ timerMode: "pomodoro", isRunning: false });
    } else {
      setIsRunning(false);
      setCurrentSeconds(dailyTrack.accumulatedSeconds);
      persistStateRef.current({ timerMode: "dailyTrack", isRunning: false });
    }
  };

  const pomodoroProgress = ((getTimeForMode(mode) - timeLeft) / getTimeForMode(mode)) * 100;
  const dailyProgress = Math.min(100, ((dailyTrack.accumulatedSeconds + currentSeconds) / DEEP_WORK_SECONDS) * 100);

  const totalDisplaySeconds = dailyTrack.accumulatedSeconds + currentSeconds;
  const isDeepWorkComplete = dailyTrack.autoCompleteTriggered || totalDisplaySeconds >= DEEP_WORK_SECONDS;

  if (!isLoaded) {
    return (
      <div className="bg-surface-hover border border-white/5 rounded-xl p-3 animate-pulse">
        <div className="h-40 flex items-center justify-center">
          <Clock className="w-6 h-6 text-gray-500" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-surface-hover border border-white/5 rounded-xl p-3 ${widgetMode === "dailyTrack" ? "bg-blue-500/5 border-blue-500/20" : getModeBg(mode)}`}>
      {/* Widget Mode Toggle */}
      <div className="flex items-center justify-center gap-1 mb-3 p-1 bg-black/20 rounded-lg">
        <button
          onClick={() => switchWidgetMode("pomodoro")}
          className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            widgetMode === "pomodoro"
              ? "bg-white/20 text-white"
              : "text-gray-400 hover:text-white hover:bg-white/10"
          }`}
        >
          <Brain className="w-3 h-3 inline mr-1" />
          Pomodoro
        </button>
        <button
          onClick={() => switchWidgetMode("dailyTrack")}
          className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            widgetMode === "dailyTrack"
              ? "bg-blue-500/30 text-blue-300"
              : "text-gray-400 hover:text-white hover:bg-white/10"
          }`}
        >
          <Clock className="w-3 h-3 inline mr-1" />
          Daily Track
        </button>
      </div>

      <AnimatePresence mode="wait">
        {widgetMode === "pomodoro" ? (
          <motion.div
            key="pomodoro"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {/* Pomodoro UI */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className={`w-4 h-4 ${getModeColor(mode)}`} />
                <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  {mode === "focus" ? "Focus" : mode === "shortBreak" ? "Break" : "Long Break"}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Coffee className="w-3 h-3" />
                <span>{sessions}</span>
              </div>
            </div>

            <div className="relative mb-3">
              <svg className="w-20 h-20 mx-auto" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-gray-700"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={283}
                  strokeDashoffset={283 - (283 * pomodoroProgress) / 100}
                  className={`${getModeColor(mode)} transition-all`}
                  style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-bold ${isRunning ? "animate-pulse text-primary drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]" : ""}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-3">
              <button
                onClick={toggleTimer}
                className={`p-2 rounded-full transition-all ${
                  isRunning
                    ? "bg-yellow-500/30 hover:bg-yellow-500/40 text-yellow-500"
                    : "bg-green-500/30 hover:bg-green-500/40 text-green-500"
                }`}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <button
                onClick={resetTimer}
                className="p-2 bg-gray-700/50 hover:bg-gray-700 rounded-full transition-all"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => switchMode("focus")}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  mode === "focus" ? "bg-red-500/30 text-red-400" : "hover:bg-white/10 text-gray-400"
                }`}
              >
                Focus
              </button>
              <button
                onClick={() => switchMode("shortBreak")}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  mode === "shortBreak" ? "bg-green-500/30 text-green-400" : "hover:bg-white/10 text-gray-400"
                }`}
              >
                Short
              </button>
              <button
                onClick={() => switchMode("longBreak")}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  mode === "longBreak" ? "bg-blue-500/30 text-blue-400" : "hover:bg-white/10 text-gray-400"
                }`}
              >
                Long
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dailyTrack"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {/* Daily Track UI */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Deep Work
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {Math.floor(totalDisplaySeconds / 3600)}h {Math.floor((totalDisplaySeconds % 3600) / 60)}m
              </div>
            </div>

            {isDeepWorkComplete ? (
              /* Deep Work Complete Badge */
              <div className="flex flex-col items-center justify-center py-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                </motion.div>
                <span className="text-sm font-bold text-green-400">Deep Work Complete!</span>
                <span className="text-xs text-gray-500 mt-1">
                  {Math.floor(totalDisplaySeconds / 3600)}h {Math.floor((totalDisplaySeconds % 3600) / 60)}m logged
                </span>
              </div>
            ) : (
              <>
                <div className="relative mb-3">
                  <svg className="w-20 h-20 mx-auto" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="text-gray-700"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={283}
                      strokeDashoffset={283 - (283 * dailyProgress) / 100}
                      className="text-blue-500 transition-all"
                      style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-lg font-bold ${isRunning ? "animate-pulse text-blue-400" : "text-white"}`}>
                      {formatHHMMSS(totalDisplaySeconds)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 mb-3">
                  {!isRunning ? (
                    dailyTrack.accumulatedSeconds > 0 ? (
                      <button
                        onClick={handleResumeDailyTrack}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/30 hover:bg-blue-500/40 text-blue-400 rounded-lg transition-all text-sm font-medium"
                      >
                        <Play className="w-4 h-4" /> Resume
                      </button>
                    ) : (
                      <button
                        onClick={handleStartDailyTrack}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/30 hover:bg-blue-500/40 text-blue-400 rounded-lg transition-all text-sm font-medium"
                      >
                        <Play className="w-4 h-4" /> Start
                      </button>
                    )
                  ) : (
                    <button
                      onClick={handlePauseDailyTrack}
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-500/30 hover:bg-yellow-500/40 text-yellow-400 rounded-lg transition-all text-sm font-medium"
                    >
                      <Pause className="w-4 h-4" /> Pause
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-center">
                  <div className="text-xs text-gray-500">
                    {Math.floor(totalDisplaySeconds / 3600)} / 4 hrs
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
