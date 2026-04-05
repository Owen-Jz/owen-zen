// src/components/journal/JournalHeatmap.tsx
"use client";

import { useMemo } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface Entry {
  date: string;
  mood: number;
  text: string;
  tags: string[];
}

interface JournalHeatmapProps {
  year: number;
  entries: Record<string, Entry>;
  onDateClick: (date: string) => void;
}

const MOOD_COLORS: Record<number, string> = {
  1: '#c0392b',
  2: '#e74c3c',
  3: '#f39c12',
  4: '#2ecc71',
  5: '#27ae60',
};

const NO_ENTRY_COLOR = '#161b22';

const CELL_SIZE = 13; // pixels
const CELL_GAP = 2; // pixels

function getCellColor(mood: number | undefined): string {
  if (!mood) return NO_ENTRY_COLOR;
  return MOOD_COLORS[mood] || NO_ENTRY_COLOR;
}

export function JournalHeatmap({ year, entries, onDateClick }: JournalHeatmapProps) {
  const weeks = useMemo(() => {
    const result: { date: string; dayOfWeek: number }[][] = [];
    const startDate = new Date(year, 0, 1);
    // Adjust to Sunday of that week
    const startSunday = new Date(startDate);
    startSunday.setDate(startSunday.getDate() - startDate.getDay());

    let current = new Date(startSunday);
    let week: { date: string; dayOfWeek: number }[] = [];

    while (current.getFullYear() <= year || current.getMonth() === 0) {
      const dateStr = current.toISOString().split('T')[0];
      const currentYear = current.getFullYear();

      if (currentYear > year) break;

      week.push({ date: dateStr, dayOfWeek: current.getDay() });

      if (week.length === 7) {
        result.push(week);
        week = [];
      }

      current = new Date(current.getTime() + 86400000);
    }

    if (week.length > 0) result.push(week);
    return result;
  }, [year]);

  const months = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result: { name: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, wi) => {
      const firstDay = week.find(d => d.date.startsWith(year.toString()));
      if (firstDay) {
        const month = new Date(firstDay.date + 'T12:00:00').getMonth();
        if (month !== lastMonth) {
          result.push({ name: monthNames[month], weekIndex: wi });
          lastMonth = month;
        }
      }
    });

    return result;
  }, [weeks, year]);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Month labels */}
        <div className="flex mb-1 ml-8">
          {months.map((m, i) => (
            <div
              key={i}
              className="text-xs text-gray-500"
              style={{ marginLeft: i === 0 ? 0 : `${(m.weekIndex - (months[i - 1]?.weekIndex ?? 0) - 1) * 14}px` }}
            >
              {m.name}
            </div>
          ))}
        </div>

        <div className="flex">
          {/* Day labels */}
          <div className="flex flex-col mr-1">
            {days.map((d, i) => (
              <div
                key={d}
                className={cn(
                  "text-xs text-gray-500 h-[14px] flex items-center",
                  i % 2 === 1 && "invisible"
                )}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex" style={{ gap: `${CELL_GAP}px` }}>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col" style={{ gap: `${CELL_GAP}px` }}>
                {week.map((day) => {
                  const entry = entries[day.date];
                  const isCurrentYear = day.date.startsWith(year.toString());
                  return (
                    <div
                      key={day.date}
                      onClick={() => isCurrentYear && onDateClick(day.date)}
                      className={cn(
                        "rounded-sm cursor-pointer transition-all hover:scale-110",
                        !isCurrentYear && "opacity-0 cursor-default"
                      )}
                      style={{
                        width: `${CELL_SIZE}px`,
                        height: `${CELL_SIZE}px`,
                        backgroundColor: isCurrentYear ? getCellColor(entry?.mood) : 'transparent'
                      }}
                      title={isCurrentYear && entry ? `${day.date} — Mood ${entry.mood}` : isCurrentYear ? `${day.date} — No entry` : ''}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
          <span>Less</span>
          <div className="rounded-sm" style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px`, backgroundColor: NO_ENTRY_COLOR }} />
          <div className="rounded-sm" style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px`, backgroundColor: MOOD_COLORS[1] }} />
          <div className="rounded-sm" style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px`, backgroundColor: MOOD_COLORS[2] }} />
          <div className="rounded-sm" style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px`, backgroundColor: MOOD_COLORS[3] }} />
          <div className="rounded-sm" style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px`, backgroundColor: MOOD_COLORS[4] }} />
          <div className="rounded-sm" style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px`, backgroundColor: MOOD_COLORS[5] }} />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
