"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";
import { motion } from "framer-motion";

type TimerMode = "focus" | "shortBreak" | "longBreak";

const WORK_TIME = 25 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;

interface PomodoroState {
  mode: TimerMode;
  timeLeft: number;
  isRunning: boolean;
  sessions: number;
  startedAt: string | null;
}

export const PomodoroWidget = () => {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const getTimeForMode = (m: TimerMode) => {
    switch (m) {
      case "focus": return WORK_TIME;
      case "shortBreak": return SHORT_BREAK;
      case "longBreak": return LONG_BREAK;
    }
  };

  useEffect(() => {
    const loadState = async () => {
      try {
        const res = await fetch("/api/pomodoro");
        const data = await res.json();
        if (data.success && data.data) {
          const state = data.data as PomodoroState;
          setMode(state.mode || "focus");
          setSessions(state.sessions || 0);
          
          if (state.isRunning && state.startedAt) {
            const elapsed = Math.floor((Date.now() - new Date(state.startedAt).getTime()) / 1000);
            const remaining = Math.max(0, state.timeLeft - elapsed);
            setTimeLeft(remaining);
            setIsRunning(true);
          } else {
            setTimeLeft(state.timeLeft || getTimeForMode(state.mode || "focus"));
          }
        }
      } catch (error) {
        console.error("Failed to load pomodoro state:", error);
      }
      setIsLoaded(true);
    };
    loadState();
  }, []);

  const saveState = async (newState: Partial<PomodoroState>) => {
    try {
      await fetch("/api/pomodoro", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newState),
      });
    } catch (error) {
      console.error("Failed to save pomodoro state:", error);
    }
  };

  const playNotificationSound = () => {
    try {
      const audioCtx = audioContextRef.current || new AudioContext();
      audioContextRef.current = audioCtx;
      
      const playTone = (freq: number, startTime: number, duration: number) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = audioCtx.currentTime;
      playTone(880, now, 0.15);
      playTone(1100, now + 0.15, 0.15);
      playTone(880, now + 0.3, 0.3);
    } catch (e) {
      console.log('Audio not supported');
    }
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      playNotificationSound();
      if (mode === "focus") {
        setSessions((prev) => prev + 1);
      }
      saveState({
        isRunning: false,
        timeLeft: getTimeForMode(mode),
        sessions: mode === "focus" ? sessions + 1 : sessions,
        startedAt: null,
      });
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, mode, sessions]);

  useEffect(() => {
    if (isLoaded && !isRunning) {
      saveState({ timeLeft, mode, sessions, isRunning, startedAt: null });
    }
  }, [timeLeft, mode, sessions]);

  useEffect(() => {
    if (isLoaded) {
      if (isRunning) {
        saveState({ isRunning: true, timeLeft, mode, sessions, startedAt: new Date().toISOString() });
      } else {
        saveState({ isRunning: false, timeLeft, mode, sessions, startedAt: null });
      }
    }
  }, [isRunning]);

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

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    const newTime = getTimeForMode(mode);
    setTimeLeft(newTime);
    saveState({
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
    saveState({
      mode: m,
      timeLeft: newTime,
      isRunning: false,
      startedAt: null,
    });
  };

  const progress = ((getTimeForMode(mode) - timeLeft) / getTimeForMode(mode)) * 100;

  return (
    <div className={`bg-surface-hover border border-white/5 rounded-xl p-3 ${getModeBg(mode)}`}>
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
            strokeDashoffset={283 - (283 * progress) / 100}
            className={`${getModeColor(mode)} transition-all`}
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold">{formatTime(timeLeft)}</span>
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
    </div>
  );
};
