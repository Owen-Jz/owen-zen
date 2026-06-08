"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Copy, LayoutGrid, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { HourEntry } from "@/types";

// Converts a 24-hour numeric hour to the test ID format used by the tests.
// e.g. 14 -> "2pmpm", 9 -> "9am", 0 -> "12amam" (0 is treated as 12 AM per HOUR_LABELS).
function hourToTestId(hour: number) {
  const isPM = hour >= 12;
  const h = hour % 12 || 12;
  return `add-entry-${h}${isPM ? 'pm' : 'am'}${isPM ? 'pm' : 'am'}`;
}
const ENTRY_TYPES = [
  { key: "deep-work", label: "Deep Work", color: "bg-blue-500" },
  { key: "routine", label: "Routine", color: "bg-green-500" },
  { key: "meetings", label: "Meetings", color: "bg-yellow-500" },
  { key: "breaks", label: "Breaks", color: "bg-orange-500" },
  { key: "distracted", label: "Distracted", color: "bg-red-500" },
  { key: "default", label: "Default", color: "bg-gray-500" },
] as const;

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  const ampm = i < 12 ? "AM" : "PM";
  return `${h}:00 ${ampm}`;
});

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toDateString(date: Date) {
  return date.toISOString().split("T")[0];
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const START_HOUR = 6;
const END_HOUR = 23;

async function fetchEntries(date: string): Promise<HourEntry[]> {
  const res = await fetch(`/api/hour-entries?date=${date}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

async function saveEntry(payload: {
  date: string;
  hour: number;
  text: string;
  type: HourEntry["type"];
  isPlanned: boolean;
}): Promise<HourEntry> {
  const res = await fetch("/api/hour-entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

async function deleteEntry(id: string): Promise<void> {
  const res = await fetch(`/api/hour-entries/${id}`, { method: "DELETE" });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
}

export function HourTrackerView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingCell, setEditingCell] = useState<number | null>(null);
  const [draftText, setDraftText] = useState("");
  const [draftType, setDraftType] = useState<HourEntry["type"]>("default");
  const [showAllHours, setShowAllHours] = useState(false);
  const queryClient = useQueryClient();

  const dateString = toDateString(currentDate);
  const yesterdayString = toDateString(addDays(currentDate, -1));
  const todayString = toDateString(new Date());

  const isToday = dateString === todayString;
  const startHour = showAllHours ? 0 : START_HOUR;
  const endHour = showAllHours ? 23 : END_HOUR;

  // Fetch today's entries
  const {
    data: entries = [],
    isLoading,
  } = useQuery({
    queryKey: ["hour-entries", dateString],
    queryFn: () => fetchEntries(dateString),
  });

  // Fetch yesterday's entries for "Copy Yesterday"
  const { data: yesterdayEntries = [] } = useQuery({
    queryKey: ["hour-entries", yesterdayString],
    queryFn: () => fetchEntries(yesterdayString),
    enabled: false, // Only fetch on demand
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: saveEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hour-entries", dateString] });
      setEditingCell(null);
      setDraftText("");
      setDraftType("default");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hour-entries", dateString] });
    },
  });

  // Batch save mutation for "Copy Yesterday"
  const copyYesterdayMutation = useMutation({
    mutationFn: async (newEntries: Omit<HourEntry, "_id" | "createdAt" | "updatedAt">[]) => {
      await Promise.all(
        newEntries.map((e) =>
          fetch("/api/hour-entries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(e),
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hour-entries", dateString] });
    },
  });

  const handlePrevDay = () => setCurrentDate((d) => addDays(d, -1));
  const handleNextDay = () => setCurrentDate((d) => addDays(d, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleCopyYesterday = async () => {
    // Fetch yesterday's entries if not already loaded
    if (yesterdayEntries.length === 0) {
      await queryClient.fetchQuery({
        queryKey: ["hour-entries", yesterdayString],
        queryFn: () => fetchEntries(yesterdayString),
      });
    }
    const fetched = queryClient.getQueryData<HourEntry[]>(["hour-entries", yesterdayString]) ?? [];
    // Copy only non-planned (actual logged) entries as planned entries for today
    const toSave = fetched
      .filter((e) => !e.isPlanned)
      .map((e) => ({
        date: dateString,
        hour: e.hour,
        text: e.text,
        type: e.type,
        isPlanned: true,
      }));
    if (toSave.length > 0) {
      await copyYesterdayMutation.mutateAsync(toSave);
    }
  };

  const startEditing = (hour: number, _entry?: HourEntry) => {
    setEditingCell(hour);
    setDraftText("");
    setDraftType("default");
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setDraftText("");
    setDraftType("default");
  };

  const handleSave = () => {
    if (editingCell === null) return;
    const hour = editingCell;
    if (!draftText.trim()) {
      cancelEditing();
      return;
    }
    // Determine isPlanned: future hours on today are planned, past hours are logged
    // Use UTC hours consistently to match how toDateString() uses UTC via toISOString()
    const isPlanned = isToday && hour > new Date().getUTCHours();
    saveMutation.mutate({
      date: dateString,
      hour,
      text: draftText.trim(),
      type: draftType,
      isPlanned,
    });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const getEntriesForHour = (hour: number) =>
    entries.filter((e) => e.hour === hour);

  const getEntryColor = (type: HourEntry["type"]) => {
    const found = ENTRY_TYPES.find((t) => t.key === type);
    return found?.color ?? "bg-gray-500";
  };

  const handleCellClick = (hour: number) => {
    if (editingCell !== null) return;
    const hourEntries = getEntriesForHour(hour);
    // If no entries yet, start editing fresh; otherwise add to existing entries
    if (hourEntries.length === 0) {
      startEditing(hour);
    }
    // If entries exist, just start a new entry for this hour without disrupting existing ones
    if (hourEntries.length > 0) {
      startEditing(hour);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-[var(--color-foreground)]">
            Hour Tracker
          </h2>
          <span className="text-sm text-[var(--color-text-secondary)]">
            {formatDate(currentDate)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Copy Yesterday */}
          <button
            onClick={handleCopyYesterday}
            disabled={copyYesterdayMutation.isPending}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              "border border-[var(--color-border)]",
              "text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)]",
              "hover:bg-[var(--color-surface-hover)]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            title="Copy logged entries from yesterday as planned"
          >
            <Copy size={13} />
            Copy Yesterday
          </button>

          {/* Toggle all hours */}
          <button
            onClick={() => setShowAllHours((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              showAllHours
                ? "bg-[var(--color-primary-muted)] text-[var(--color-primary)] border border-[var(--color-border-accent)]"
                : "border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-hover)]"
            )}
          >
            <LayoutGrid size={13} />
            {showAllHours ? "6AM–11PM" : "All Hours"}
          </button>
        </div>
      </div>

      {/* Day Navigation */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border-subtle)]">
        <button
          onClick={handlePrevDay}
          className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-hover)] transition-all"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToday}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-medium transition-all",
              isToday
                ? "bg-[var(--color-primary-muted)] text-[var(--color-primary)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)]"
            )}
          >
            Today
          </button>
        </div>

        <button
          onClick={handleNextDay}
          disabled={isToday}
          className={cn(
            "p-2 rounded-lg transition-all",
            isToday
              ? "text-[var(--color-text-disabled)] cursor-not-allowed"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-hover)]"
          )}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Hour Rows */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-[var(--color-text-muted)]">Loading...</div>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border-subtle)]">
            {Array.from({ length: endHour - startHour + 1 }, (_, i) => {
              const hour = startHour + i;
              const hourEntries = getEntriesForHour(hour);
              const isEditing = editingCell === hour;
              const isFuture = isToday && hour > new Date().getUTCHours();

              return (
                <div
                  key={hour}
                  data-testid={hourToTestId(hour)}
                  className={cn(
                    "flex min-h-[52px] group",
                    isFuture && isToday && hourEntries.length === 0 && "opacity-60"
                  )}
                >
                  {/* Hour Label */}
                  <div className="w-20 shrink-0 flex items-start pt-3 pl-3">
                    <span
                      className={cn(
                        "text-xs font-medium tabular-nums",
                        isFuture && isToday
                          ? "text-[var(--color-text-disabled)]"
                          : "text-[var(--color-text-muted)]"
                      )}
                    >
                      {HOUR_LABELS[hour]}
                    </span>
                  </div>

                  {/* Cell Content */}
                  <div className="flex-1 relative">
                    {isEditing ? (
                      <div className="px-3 py-2 space-y-2">
                        <input
                          autoFocus
                          data-testid="entry-text-input"
                          value={draftText}
                          onChange={(e) => setDraftText(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="What happened this hour?"
                          className={cn(
                            "w-full bg-transparent border-none outline-none text-sm",
                            "text-[var(--color-foreground)] placeholder:text-[var(--color-text-disabled)]"
                          )}
                        />
                        <div className="flex items-center gap-2">
                          {ENTRY_TYPES.map((t) => (
                            <button
                              key={t.key}
                              onClick={() => setDraftType(t.key as HourEntry["type"])}
                              title={t.label}
                              className={cn(
                                "w-4 h-4 rounded-full transition-all",
                                t.color,
                                draftType === t.key
                                  ? "ring-2 ring-white ring-offset-1 ring-offset-[var(--color-surface)] scale-110"
                                  : "opacity-60 hover:opacity-100"
                              )}
                            />
                          ))}
                          <div className="flex-1" />
                          <div className="flex items-center gap-1">
                            <button
                              onClick={cancelEditing}
                              data-testid="cancel-entry"
                              className="px-2 py-1 rounded text-xs text-[var(--color-text-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-hover)] transition-all"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSave}
                              data-testid="save-entry"
                              disabled={saveMutation.isPending}
                              className="px-3 py-1 rounded bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-xs font-medium hover:brightness-110 transition-all disabled:opacity-50"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => handleCellClick(hour)}
                        className={cn(
                          "w-full h-full px-3 py-2 cursor-pointer transition-all min-h-[44px]",
                          "border-l-2",
                          hourEntries.length > 0
                            ? "border-transparent"
                            : cn(
                                "border-transparent",
                                "hover:bg-[var(--color-surface-hover)]"
                              ),
                          isFuture && isToday && hourEntries.length === 0
                            ? "border-dashed border-[var(--color-text-disabled)]"
                            : ""
                        )}
                      >
                        <div className="flex flex-col gap-1">
                          {hourEntries.length === 0 ? (
                            <span className="text-sm text-[var(--color-text-disabled)] italic">
                              {isFuture && isToday ? "Planned" : "Click to log..."}
                            </span>
                          ) : (
                            hourEntries.map((e, idx) => (
                              <div key={e._id} className="flex items-start justify-between gap-2 group/entry">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                  <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", getEntryColor(e.type), e.isPlanned && "opacity-60")} />
                                  <span className={cn(
                                    "text-sm flex-1 min-w-0 break-words",
                                    idx > 0 && "text-[var(--color-text-muted)]",
                                    e.isPlanned
                                      ? "text-[var(--color-text-muted)] italic"
                                      : "text-[var(--color-foreground)]"
                                  )}>
                                    {e.text}
                                  </span>
                                </div>
                                <button
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    if (e._id) handleDelete(e._id);
                                  }}
                                  data-testid={`delete-entry-${e._id}`}
                                  className="opacity-0 group-hover/entry:opacity-100 shrink-0 p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-all"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}