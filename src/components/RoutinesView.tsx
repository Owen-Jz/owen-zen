"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Loading } from "@/components/Loading";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface RoutineItem {
  _id: string;
  title: string;
  completedDates: string[];
}

interface Routine {
  _id: string;
  title: string;
  icon: string;
  color: string;
  items: RoutineItem[];
  order: number;
}

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Africa/Lagos",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const toLocalString = (d: Date | string) => {
  const dateObj = typeof d === "string" ? new Date(d) : d;
  const parts = formatter.formatToParts(dateObj);
  const yr = parts.find((p) => p.type === "year")?.value;
  const mo = parts.find((p) => p.type === "month")?.value;
  const da = parts.find((p) => p.type === "day")?.value;
  return `${yr}-${mo}-${da}`;
};

const getTodayStr = () => toLocalString(new Date());

const getIntensity = (count: number, max: number) => {
  if (max === 0) return 0;
  const ratio = count / max;
  if (ratio === 0) return 0;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
};

const intensityColors = [
  "bg-white/5",
  "bg-primary/25",
  "bg-primary/50",
  "bg-primary/75",
  "bg-primary",
];

const WeekStrip = ({ routines, weekOffset }: { routines: Routine[]; weekOffset: number }) => {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const maxItems = routines.reduce((sum, r) => sum + r.items.length, 0);

  return (
    <div className="flex gap-1">
      {days.map((day, i) => {
        const dayStr = toLocalString(day);
        const completedCount = routines.reduce((sum, r) => {
          return sum + r.items.filter((item) =>
            item.completedDates.some((d) => toLocalString(d) === dayStr)
          ).length;
        }, 0);
        const intensity = getIntensity(completedCount, maxItems);
        const isToday = dayStr === getTodayStr();
        const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-gray-500">{dayLabels[i]}</span>
            <div
              className={cn(
                "w-8 h-8 rounded-sm transition-colors",
                intensityColors[intensity],
                isToday && "ring-1 ring-primary"
              )}
              title={`${dayStr}: ${completedCount}/${maxItems} items completed`}
            />
          </div>
        );
      })}
    </div>
  );
};

const MonthGrid = ({ routines, monthOffset }: { routines: Routine[]; monthOffset: number }) => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + monthOffset + 1, 0);

  const maxItems = routines.reduce((sum, r) => sum + r.items.length, 0);

  const startPadding = (firstDay.getDay() + 6) % 7;
  const totalCells = startPadding + lastDay.getDate();
  const rows = Math.ceil(totalCells / 7);

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <span key={d} className="w-4 text-[10px] text-gray-500 text-center">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: rows * 7 }, (_, i) => {
          const dayNum = i - startPadding + 1;
          if (dayNum < 1 || dayNum > lastDay.getDate()) {
            return <div key={i} className="w-4 h-4" />;
          }
          const cellDate = new Date(firstDay.getFullYear(), firstDay.getMonth(), dayNum);
          const cellStr = toLocalString(cellDate);
          const completedCount = routines.reduce((sum, r) => {
            return sum + r.items.filter((item) =>
              item.completedDates.some((d) => toLocalString(d) === cellStr)
            ).length;
          }, 0);
          const intensity = getIntensity(completedCount, maxItems);
          const isToday = cellStr === getTodayStr();
          return (
            <div
              key={i}
              className={cn(
                "w-4 h-4 rounded-sm transition-colors",
                intensityColors[intensity],
                isToday && "ring-1 ring-primary"
              )}
              title={`${cellStr}: ${completedCount}/${maxItems}`}
            />
          );
        })}
      </div>
    </div>
  );
};

const RoutineItemRow = ({
  item,
  routineId,
  onToggle,
  onEditTitle,
}: {
  item: RoutineItem;
  routineId: string;
  onToggle: (itemId: string, completed: boolean) => void;
  onEditTitle: (itemId: string, title: string) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.title);
  const todayStr = getTodayStr();
  const completed = item.completedDates.some((d) => toLocalString(d) === todayStr);

  const handleDoubleClick = () => {
    setEditValue(item.title);
    setEditing(true);
  };

  const handleSave = () => {
    if (editValue.trim() && editValue.trim() !== item.title) {
      onEditTitle(item._id, editValue.trim());
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") setEditing(false);
  };

  return (
    <motion.div
      layout
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg border transition-all cursor-pointer",
        completed
          ? "border-primary/30 bg-primary/5"
          : "border-white/5 bg-white/[2%] hover:bg-white/[4%]"
      )}
      onClick={() => onToggle(item._id, !completed)}
    >
      <motion.div
        animate={{ scale: completed ? 1 : 0.9 }}
        className={cn(
          "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0",
          completed ? "border-primary bg-primary" : "border-gray-600"
        )}
      >
        {completed && <Check size={12} className="text-black" strokeWidth={3} />}
      </motion.div>

      {editing ? (
        <input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-transparent border-b border-primary/50 outline-none text-sm"
        />
      ) : (
        <span
          className={cn("flex-1 text-sm", completed && "line-through text-gray-500")}
          onDoubleClick={handleDoubleClick}
          title="Double-click to edit"
        >
          {item.title}
        </span>
      )}
    </motion.div>
  );
};

export const RoutinesView = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [view, setView] = useState<"week" | "month">("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    fetch("/api/routines")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setRoutines(j.data);
          if (j.data.length > 0) setSelectedRoutine(j.data[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const todayStr = getTodayStr();

  const completedToday = useMemo(() => {
    if (!selectedRoutine) return 0;
    return selectedRoutine.items.filter((item) =>
      item.completedDates.some((d) => toLocalString(d) === todayStr)
    ).length;
  }, [selectedRoutine, todayStr]);

  const totalItems = selectedRoutine?.items.length ?? 0;
  const allComplete = totalItems > 0 && completedToday === totalItems;

  const toggleItem = async (itemId: string, currentCompleted: boolean) => {
    if (!selectedRoutine) return;

    // Optimistic update
    setSelectedRoutine((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        items: prev.items.map((item) => {
          if (item._id !== itemId) return item;
          const newDates = currentCompleted
            ? item.completedDates.filter((d) => toLocalString(d) !== todayStr)
            : [...item.completedDates, todayStr];
          return { ...item, completedDates: newDates };
        }),
      };
      return updated;
    });

    // Update routines list too
    setRoutines((prev) =>
      prev.map((r) => {
        if (r._id !== selectedRoutine._id) return r;
        return {
          ...r,
          items: r.items.map((item) => {
            if (item._id !== itemId) return item;
            const newDates = currentCompleted
              ? item.completedDates.filter((d) => toLocalString(d) !== todayStr)
              : [...item.completedDates, todayStr];
            return { ...item, completedDates: newDates };
          }),
        };
      })
    );

    try {
      const res = await fetch(`/api/routines/${selectedRoutine._id}/items/${itemId}/toggle`, {
        method: "PUT",
      });
      const json = await res.json();
      if (!json.success) {
        // Revert on failure
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  };

  const editItemTitle = async (itemId: string, newTitle: string) => {
    if (!selectedRoutine) return;
    setSelectedRoutine((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((item) =>
          item._id === itemId ? { ...item, title: newTitle } : item
        ),
      };
    });
    await fetch(`/api/routines/${selectedRoutine._id}/items/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
  };

  const addItem = async () => {
    if (!selectedRoutine) return;
    const title = "New item";
    const res = await fetch(`/api/routines/${selectedRoutine._id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const json = await res.json();
    if (json.success) {
      const newItem = json.data.items[json.data.items.length - 1];
      setSelectedRoutine((prev) =>
        prev ? { ...prev, items: [...prev.items, newItem] } : prev
      );
    }
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Africa/Lagos",
  });

  if (loading) return <Loading />;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Routine selector tabs */}
      <div className="flex gap-2 flex-wrap">
        {routines.map((routine) => (
          <button
            key={routine._id}
            onClick={() => setSelectedRoutine(routine)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border",
              selectedRoutine?._id === routine._id
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-white/5 bg-white/[2%] text-gray-400 hover:bg-white/[4%]"
            )}
          >
            <span>{routine.icon}</span>
            <span>{routine.title}</span>
          </button>
        ))}
      </div>

      {selectedRoutine && (
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedRoutine._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedRoutine.icon}</span>
                <h2 className="text-2xl font-bold">{selectedRoutine.title}</h2>
              </div>
              <p className="text-sm text-gray-500">{dateStr}</p>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{completedToday}/{totalItems} items completed today</span>
                  <span>{totalItems > 0 ? Math.round((completedToday / totalItems) * 100) : 0}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: selectedRoutine.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${totalItems > 0 ? (completedToday / totalItems) * 100 : 0}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>
            </div>

            {/* Item list */}
            <motion.div
              animate={allComplete ? { scale: [1, 1.03, 1] } : {}}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">Items</h3>
                <button
                  onClick={addItem}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus size={12} />
                  Add item
                </button>
              </div>

              {selectedRoutine.items.length === 0 ? (
                <div className="text-center py-8 text-gray-600 text-sm">
                  No items yet. Add your first item to get started.
                </div>
              ) : (
                selectedRoutine.items.map((item) => (
                  <RoutineItemRow
                    key={item._id}
                    item={item}
                    routineId={selectedRoutine._id}
                    onToggle={toggleItem}
                    onEditTitle={editItemTitle}
                  />
                ))
              )}
            </motion.div>

            {/* Celebration overlay */}
            <AnimatePresence>
              {allComplete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="fixed inset-0 pointer-events-none flex items-center justify-center z-50"
                >
                  <div className="bg-primary/20 border border-primary/30 rounded-2xl px-8 py-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <Check size={16} className="text-black" strokeWidth={3} />
                    </div>
                    <span className="text-primary font-bold">Routine Complete!</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Consistency graph */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">Consistency</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => setView("week")}
                    className={cn(
                      "px-2 py-1 text-xs rounded transition-colors",
                      view === "week" ? "bg-primary/20 text-primary" : "text-gray-500 hover:text-white"
                    )}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setView("month")}
                    className={cn(
                      "px-2 py-1 text-xs rounded transition-colors",
                      view === "month" ? "bg-primary/20 text-primary" : "text-gray-500 hover:text-white"
                    )}
                  >
                    Month
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    if (view === "week") setWeekOffset((w) => w - 1);
                    else setMonthOffset((m) => m - 1);
                  }}
                  className="p-1 text-gray-500 hover:text-white transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <div>
                  {view === "week" ? (
                    <WeekStrip routines={[selectedRoutine]} weekOffset={weekOffset} />
                  ) : (
                    <MonthGrid routines={[selectedRoutine]} monthOffset={monthOffset} />
                  )}
                </div>
                <button
                  onClick={() => {
                    if (view === "week") setWeekOffset((w) => w + 1);
                    else setMonthOffset((m) => m + 1);
                  }}
                  className="p-1 text-gray-500 hover:text-white transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};
