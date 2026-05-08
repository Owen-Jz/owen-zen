"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { SkeletonCard } from "./SkeletonCard";

interface TodayCardProps {
  streak?: number;
}

// Calculate day of year (1-365 or 1-366)
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

// Check if leap year
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// Get total days in year
function getDaysInYear(date: Date): number {
  return isLeapYear(date.getFullYear()) ? 366 : 365;
}

// Calculate moon phase (0 = new moon, 0.5 = full moon)
// Uses synodic month ~29.53 days, reference new moon Jan 6 2000 18:14 UTC
function getMoonPhase(date: Date): number {
  const referenceNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
  const synodicMonth = 29.53058867;
  const diffMs = date.getTime() - referenceNewMoon.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const cycles = diffDays / synodicMonth;
  return cycles - Math.floor(cycles);
}

// Get moon phase emoji
function getMoonPhaseEmoji(phase: number): string {
  if (phase < 0.0625) return "🌑";
  if (phase < 0.1875) return "🌒";
  if (phase < 0.3125) return "🌓";
  if (phase < 0.4375) return "🌔";
  if (phase < 0.5625) return "🌕";
  if (phase < 0.6875) return "🌖";
  if (phase < 0.8125) return "🌗";
  if (phase < 0.9375) return "🌘";
  return "🌑";
}

// Get time-based greeting
function getGreeting(hour: number): string {
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Good Night";
}

export function TodayCard({ streak = 0 }: TodayCardProps) {
  const [time, setTime] = useState("");
  const [formattedDate, setFormattedDate] = useState("");
  const [dayOfYear, setDayOfYear] = useState(0);
  const [daysInYear, setDaysInYear] = useState(365);
  const [greeting, setGreeting] = useState("");
  const [moonEmoji, setMoonEmoji] = useState("🌑");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
      setFormattedDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })
      );

      // Calculate day of year
      const doy = getDayOfYear(now);
      const diy = getDaysInYear(now);
      setDayOfYear(doy);
      setDaysInYear(diy);

      // Update greeting every minute
      const hour = now.getHours();
      setGreeting(getGreeting(hour));

      // Calculate moon phase
      const phase = getMoonPhase(now);
      setMoonEmoji(getMoonPhaseEmoji(phase));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // SVG ring dimensions
  const size = 140;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Progress: dayOfYear / daysInYear (0 to 1)
  const progress = dayOfYear / daysInYear;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="rounded-xl border p-5 flex flex-col justify-between h-full min-h-[180px] hover:shadow-md transition-all duration-200 hover:-translate-y-px cursor-pointer bg-[var(--cc-card)] border-[var(--cc-border)]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--cc-text-secondary)" }}>
              {greeting}
            </span>
            <span className="text-sm" style={{ color: "var(--cc-text-secondary)" }}>{moonEmoji}</span>
          </div>
          <p className="text-sm mb-2" style={{ color: "var(--cc-text-secondary)" }}>
            {formattedDate}
          </p>
          {streak > 0 && (
            <div className="flex items-center gap-1.5">
              <Flame size={14} style={{ color: "var(--cc-accent)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--cc-accent)" }}>
                {streak} day streak
              </span>
            </div>
          )}
        </div>

        {/* Day of Year Ring */}
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            style={{ transform: "rotate(-90deg)" }}
          >
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--cc-border)"
              strokeWidth={strokeWidth}
            />
            {/* Progress arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--cc-accent)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-3xl font-bold"
              style={{ fontFamily: "var(--font-heading)", color: "var(--cc-text)" }}
            >
              {dayOfYear}
            </span>
            <span className="text-xs" style={{ color: "var(--cc-text-secondary)" }}>
              / {daysInYear}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs" style={{ color: "var(--cc-text-secondary)" }}>
          {time}
        </span>
        <span className="text-xs" style={{ color: "var(--cc-text-secondary)" }}>
          Day {dayOfYear} of {daysInYear}
        </span>
      </div>
    </div>
  );
}

export function TodayCardSkeleton() {
  return (
    <div className="rounded-xl border p-5 min-h-[140px] bg-[var(--cc-card)] border-[var(--cc-border)]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <SkeletonCard className="h-3 w-20 mb-3" />
          <SkeletonCard className="h-8 w-32 mb-2" />
          <SkeletonCard className="h-4 w-40" />
        </div>
        <div className="rounded-full border-4 border-[var(--cc-border)]" style={{ width: 140, height: 140 }} />
      </div>
    </div>
  );
}
