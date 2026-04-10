"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Dumbbell, Flame, Calendar, TrendingUp, Check, X, Trash2, Edit2, Save, ChevronDown, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Loading } from "@/components/Loading";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn("bg-surface/50 animate-pulse rounded-xl", className)} />
);

const SkeletonStats = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-surface border border-border rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <SkeletonCard className="w-9 h-9 rounded-lg" />
          <SkeletonCard className="w-20 h-4" />
        </div>
        <SkeletonCard className="w-24 h-8" />
      </div>
    ))}
  </div>
);

const SkeletonContent = () => (
  <div className="space-y-4">
    <SkeletonCard className="h-12 w-48" />
    <div className="bg-surface border border-border rounded-2xl p-6">
      <SkeletonCard className="h-48 w-full" />
    </div>
  </div>
);

interface Exercise {
  _id: string;
  name: string;
  sets: { reps: number; weight: number }[];
}

interface GymSession {
  _id: string;
  date: string;
  exercises: Exercise[];
  duration?: number;
  notes?: string;
}

const DEFAULT_EXERCISES = [
  "Bench Press",
  "Squat",
  "Deadlift",
  "Overhead Press",
  "Barbell Row",
  "Pull-ups",
  "Dumbbell Curl",
  "Tricep Pushdown",
  "Leg Press",
  "Lat Pulldown",
  "Cable Fly",
  "Face Pull",
  "Lateral Raise",
  "Leg Curl",
  "Leg Extension",
  "Calf Raise",
  "Plank",
  "Hanging Leg Raise",
];

const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Africa/Lagos',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

const toLocalString = (d: Date | string) => {
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  const parts = formatter.formatToParts(dateObj);
  const yr = parts.find(p => p.type === 'year')?.value;
  const mo = parts.find(p => p.type === 'month')?.value;
  const da = parts.find(p => p.type === 'day')?.value;
  return `${yr}-${mo}-${da}`;
};

export const GymView = () => {
  const [sessions, setSessions] = useState<GymSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSession, setShowAddSession] = useState(false);
  const [view, setView] = useState<"today" | "history" | "stats">("today");
  const [selectedDate, setSelectedDate] = useState(toLocalString(new Date()));
  const [sessionExercises, setSessionExercises] = useState<Exercise[]>([]);
  const [sessionNotes, setSessionNotes] = useState("");
  const [newExerciseName, setNewExerciseName] = useState("");
  const [showExerciseDropdown, setShowExerciseDropdown] = useState(false);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/gym-sessions");
      const json = await res.json();
      if (json.success) {
        setSessions(json.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const todaySession = useMemo(() => {
    const today = toLocalString(new Date());
    return sessions.find(s => s.date === today);
  }, [sessions]);

  const thisWeekSessions = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    return sessions.filter(s => {
      const sessionDate = new Date(s.date);
      return sessionDate >= startOfWeek;
    });
  }, [sessions]);

  const streak = useMemo(() => {
    if (sessions.length === 0) return 0;
    let currentStreak = 0;
    const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = toLocalString(checkDate);
      if (sessions.some(s => s.date === dateStr)) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }
    return currentStreak;
  }, [sessions]);

  const totalWorkouts = sessions.length;

  const addExercise = () => {
    if (!newExerciseName.trim()) return;
    setSessionExercises([...sessionExercises, {
      _id: Date.now().toString(),
      name: newExerciseName,
      sets: [{ reps: 0, weight: 0 }]
    }]);
    setNewExerciseName("");
    setShowExerciseDropdown(false);
  };

  const removeExercise = (index: number) => {
    setSessionExercises(sessionExercises.filter((_, i) => i !== index));
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: "reps" | "weight", value: number) => {
    const updated = [...sessionExercises];
    updated[exerciseIndex].sets[setIndex][field] = value;
    setSessionExercises(updated);
  };

  const addSet = (exerciseIndex: number) => {
    const updated = [...sessionExercises];
    const lastSet = updated[exerciseIndex].sets[updated[exerciseIndex].sets.length - 1];
    updated[exerciseIndex].sets.push({ 
      reps: lastSet?.reps || 0, 
      weight: lastSet?.weight || 0 
    });
    setSessionExercises(updated);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updated = [...sessionExercises];
    updated[exerciseIndex].sets = updated[exerciseIndex].sets.filter((_, i) => i !== setIndex);
    setSessionExercises(updated);
  };

  const saveSession = async () => {
    if (sessionExercises.length === 0) return;
    
    const sessionData = {
      date: selectedDate,
      exercises: sessionExercises,
      notes: sessionNotes
    };

    const res = await fetch("/api/gym-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sessionData)
    });

    const json = await res.json();
    if (json.success) {
      setSessions([...sessions, json.data]);
      setShowAddSession(false);
      setSessionExercises([]);
      setSessionNotes("");
    }
  };

  const deleteSession = async (id: string) => {
    await fetch(`/api/gym-sessions/${id}`, { method: "DELETE" });
    setSessions(sessions.filter(s => s._id !== id));
  };

  const filteredExercises = DEFAULT_EXERCISES.filter(
    e => !sessionExercises.some(se => se.name === e) && 
    e.toLowerCase().includes(newExerciseName.toLowerCase())
  );

  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(toLocalString(d));
    }
    return days;
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto pb-20">
      {loading ? (
        <>
          <SkeletonStats />
          <SkeletonContent />
        </>
      ) : (
        <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <span className="text-gray-400 text-sm">Current Streak</span>
          </div>
          <p className="text-3xl font-bold">{streak} <span className="text-lg text-gray-500 font-normal">days</span></p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Calendar className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-gray-400 text-sm">This Week</span>
          </div>
          <p className="text-3xl font-bold">{thisWeekSessions.length} <span className="text-lg text-gray-500 font-normal">sessions</span></p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Dumbbell className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-gray-400 text-sm">Total Workouts</span>
          </div>
          <p className="text-3xl font-bold">{totalWorkouts}</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
            <span className="text-gray-400 text-sm">This Month</span>
          </div>
          <p className="text-3xl font-bold">
            {sessions.filter(s => {
              const d = new Date(s.date);
              const now = new Date();
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setView("today")}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium transition-all",
            view === "today" ? "bg-primary text-white" : "bg-surface border border-border text-gray-400 hover:text-white"
          )}
        >
          Today's Workout
        </button>
        <button
          onClick={() => setView("history")}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium transition-all",
            view === "history" ? "bg-primary text-white" : "bg-surface border border-border text-gray-400 hover:text-white"
          )}
        >
          History
        </button>
        <button
          onClick={() => setView("stats")}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium transition-all",
            view === "stats" ? "bg-primary text-white" : "bg-surface border border-border text-gray-400 hover:text-white"
          )}
        >
          Consistency
        </button>
      </div>

      <AnimatePresence mode="wait">
        {view === "today" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {!showAddSession && !todaySession ? (
              <div className="bg-surface border border-border rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Dumbbell className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">No workout logged today</h3>
                <p className="text-gray-400 mb-6">Ready to crush it? Log your gym session.</p>
                <button
                  onClick={() => setShowAddSession(true)}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all"
                >
                  Start Workout
                </button>
              </div>
            ) : todaySession ? (
              <div className="bg-surface border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      Today's Workout
                    </h3>
                    <p className="text-gray-400 text-sm">{todaySession.exercises.length} exercises</p>
                  </div>
                  <button
                    onClick={() => deleteSession(todaySession._id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  {todaySession.exercises.map((exercise, idx) => (
                    <div key={idx} className="bg-background/50 rounded-xl p-4">
                      <h4 className="font-medium mb-3">{exercise.name}</h4>
                      <div className="grid grid-cols-4 gap-2 text-sm text-gray-400 mb-2">
                        <span>Set</span>
                        <span>Weight</span>
                        <span>Reps</span>
                        <span></span>
                      </div>
                      {exercise.sets.map((set, setIdx) => (
                        <div key={setIdx} className="grid grid-cols-4 gap-2 items-center mb-2">
                          <span className="text-gray-500">{setIdx + 1}</span>
                          <span>{set.weight}kg</span>
                          <span>{set.reps}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {showAddSession && (
              <div className="bg-surface border border-border rounded-2xl p-6 mt-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Log Workout</h3>
                  <button
                    onClick={() => {
                      setShowAddSession(false);
                      setSessionExercises([]);
                      setSessionNotes("");
                    }}
                    className="p-2 text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  {sessionExercises.map((exercise, idx) => (
                    <div key={idx} className="bg-background/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{exercise.name}</h4>
                        <button
                          onClick={() => removeExercise(idx)}
                          className="p-1 text-gray-500 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-sm text-gray-400 mb-2">
                        <span>Set</span>
                        <span>Weight (kg)</span>
                        <span>Reps</span>
                        <span></span>
                      </div>
                      {exercise.sets.map((set, setIdx) => (
                        <div key={setIdx} className="grid grid-cols-4 gap-2 items-center mb-2">
                          <span className="text-gray-500">{setIdx + 1}</span>
                          <input
                            type="number"
                            value={set.weight}
                            onChange={(e) => updateSet(idx, setIdx, "weight", Number(e.target.value))}
                            className="bg-surface border border-border rounded-lg px-2 py-1 text-sm"
                            placeholder="0"
                          />
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) => updateSet(idx, setIdx, "reps", Number(e.target.value))}
                            className="bg-surface border border-border rounded-lg px-2 py-1 text-sm"
                            placeholder="0"
                          />
                          <button
                            onClick={() => removeSet(idx, setIdx)}
                            className="p-1 text-gray-500 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addSet(idx)}
                        className="text-sm text-primary hover:text-primary/80 mt-2"
                      >
                        + Add Set
                      </button>
                    </div>
                  ))}
                </div>

                <div className="relative mb-6">
                  <input
                    type="text"
                    value={newExerciseName}
                    onChange={(e) => {
                      setNewExerciseName(e.target.value);
                      setShowExerciseDropdown(true);
                    }}
                    onFocus={() => setShowExerciseDropdown(true)}
                    placeholder="Add an exercise..."
                    className="w-full bg-background border border-border rounded-xl px-4 py-3"
                  />
                  {showExerciseDropdown && filteredExercises.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-surface border border-border rounded-xl mt-1 max-h-60 overflow-y-auto z-10">
                      {filteredExercises.map(ex => (
                        <button
                          key={ex}
                          onClick={() => {
                            setSessionExercises([...sessionExercises, {
                              _id: Date.now().toString(),
                              name: ex,
                              sets: [{ reps: 0, weight: 0 }]
                            }]);
                            setNewExerciseName("");
                            setShowExerciseDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-background/50"
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Notes (optional)..."
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 mb-6 resize-none"
                  rows={2}
                />

                <button
                  onClick={saveSession}
                  disabled={sessionExercises.length === 0}
                  className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Workout
                </button>
              </div>
            )}
          </motion.div>
        )}

        {view === "history" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {sessions.length === 0 ? (
              <div className="bg-surface border border-border rounded-2xl p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">No workouts yet</h3>
                <p className="text-gray-400">Start tracking your gym sessions to see history.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {[...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((session) => (
                  <div key={session._id} className="bg-surface border border-border rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold">
                          {new Date(session.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </h3>
                        <p className="text-gray-400 text-sm">{session.exercises.length} exercises</p>
                      </div>
                      <button
                        onClick={() => deleteSession(session._id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid gap-3">
                      {session.exercises.map((exercise, idx) => (
                        <div key={idx} className="bg-background/50 rounded-lg p-3">
                          <h4 className="font-medium text-sm mb-2">{exercise.name}</h4>
                          <div className="flex flex-wrap gap-2">
                            {exercise.sets.map((set, setIdx) => (
                              <span key={setIdx} className="text-xs bg-surface border border-border px-2 py-1 rounded">
                                {set.weight}kg × {set.reps}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {session.notes && (
                      <p className="mt-4 text-sm text-gray-400 italic">{session.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {view === "stats" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-surface border border-border rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6">Last 30 Days - Workout Frequency</h3>
              <div className="h-40 flex items-end justify-between gap-1">
                {Array.from({ length: 30 }, (_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (29 - i));
                  const dateStr = toLocalString(d);
                  const session = sessions.find(s => s.date === dateStr);
                  const exerciseCount = session ? session.exercises.length : 0;
                  const maxExercises = Math.max(...sessions.map(s => s.exercises.length), 5);
                  const height = exerciseCount > 0 ? (exerciseCount / maxExercises) * 100 : 10;
                  const isToday = i === 29;
                  
                  return (
                    <div key={i} className="w-full flex flex-col justify-end gap-1 group relative h-full">
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 border border-white/10 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold text-white shadow-xl pointer-events-none">
                        {exerciseCount > 0 ? `${exerciseCount} exercises` : 'Rest day'}
                      </div>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 0.3, delay: i * 0.02 }}
                        className={cn(
                          "w-full rounded-t-md transition-all group-hover:brightness-125",
                          exerciseCount > 0 
                            ? isToday 
                              ? "bg-gradient-to-t from-primary/30 via-primary to-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)]"
                              : "bg-gradient-to-t from-green-600/40 to-green-500"
                            : "bg-gray-800/50"
                        )}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>30 days ago</span>
                <span>Today</span>
              </div>
            </div>

            <div className="mt-6 bg-surface border border-border rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6">Last 7 Days</h3>
              <div className="grid grid-cols-7 gap-2">
                {last7Days.map((date) => {
                  const hasWorkout = sessions.some(s => s.date === date);
                  const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
                  return (
                    <div key={date} className="text-center">
                      <p className="text-xs text-gray-500 mb-2">{dayName}</p>
                      <div className={cn(
                        "w-full aspect-square rounded-xl flex items-center justify-center",
                        hasWorkout ? "bg-green-500/20" : "bg-background/50"
                      )}>
                        {hasWorkout && <Check className="w-5 h-5 text-green-500" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 bg-surface border border-border rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6">Monthly Overview</h3>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }, (_, i) => {
                  const d = new Date();
                  d.setDate(1);
                  d.setDate(d.getDate() + i - d.getDay());
                  const dateStr = toLocalString(d);
                  const hasWorkout = sessions.some(s => s.date === dateStr);
                  const isFuture = new Date(dateStr) > new Date();
                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "aspect-square rounded-lg flex items-center justify-center text-xs",
                        isFuture ? "bg-transparent" : hasWorkout ? "bg-green-500/30 text-green-400" : "bg-background/30 text-gray-600"
                      )}
                      title={dateStr}
                    >
                      {d.getDate()}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500/30 rounded"></div>
                  <span>Workout</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-background/30 rounded"></div>
                  <span>Rest</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </>
      )}
    </div>
  );
};
