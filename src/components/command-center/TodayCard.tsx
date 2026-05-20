"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { motion } from "framer-motion";
import { Sparkline } from "./MiniChart";

interface TodayCardProps {
  streak?: number;
  weeklyData?: number[];
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDaysInYear(date: Date): number {
  return isLeapYear(date.getFullYear()) ? 366 : 365;
}

function getMoonPhase(date: Date): number {
  const referenceNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
  const synodicMonth = 29.53058867;
  const diffDays = (date.getTime() - referenceNewMoon.getTime()) / (1000 * 60 * 60 * 24);
  return synodicMonth > 0 ? (diffDays / synodicMonth) % 1 : 0;
}

function getMoonPhaseEmoji(phase: number): { emoji: string; label: string } {
  if (phase < 0.0625) return { emoji: "🌑", label: "New Moon" };
  if (phase < 0.1875) return { emoji: "🌒", label: "Waxing Crescent" };
  if (phase < 0.3125) return { emoji: "🌓", label: "First Quarter" };
  if (phase < 0.4375) return { emoji: "🌔", label: "Waxing Gibbous" };
  if (phase < 0.5625) return { emoji: "🌕", label: "Full Moon" };
  if (phase < 0.6875) return { emoji: "🌖", label: "Waning Gibbous" };
  if (phase < 0.8125) return { emoji: "🌗", label: "Last Quarter" };
  if (phase < 0.9375) return { emoji: "🌘", label: "Waning Crescent" };
  return { emoji: "🌑", label: "New Moon" };
}

const taglines = [
  "Keep the streak alive.",
  "Make it count.",
  "One day at a time.",
  "You're in the zone.",
  "Small steps, big results.",
];

export function TodayCard({ streak = 0, weeklyData = [] }: TodayCardProps) {
  const [formattedDate, setFormattedDate] = useState("");
  const [dayOfYear, setDayOfYear] = useState(0);
  const [daysInYear, setDaysInYear] = useState(365);
  const [tagline, setTagline] = useState(taglines[0]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () => {
      const now = new Date();
      setFormattedDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })
      );
      setDayOfYear(getDayOfYear(now));
      setDaysInYear(getDaysInYear(now));
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setTagline(taglines[Math.floor(Math.random() * taglines.length)]);
  }, []);

  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = dayOfYear / daysInYear;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.01, boxShadow: "0 4px 20px rgba(212,168,83,0.15)" }}
      className="rounded-2xl border p-5 flex flex-col justify-between h-full min-h-[200px] gap-3"
      style={{
        backgroundColor: "var(--cc-card)",
        borderColor: "var(--cc-border)",
        transition: "box-shadow 200ms ease",
      }}
    >
      {/* Top section — Hero streak + date */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-1"
            style={{ color: "var(--cc-text-secondary)" }}
          >
            {formattedDate || "Loading..."}
          </p>
          {streak > 0 ? (
            <motion.div
              className="flex items-center gap-2 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Flame size={28} style={{ color: "var(--cc-accent)" }} className="drop-shadow-[0_0_8px_rgba(212,168,83,0.6)]" />
              </motion.div>
              <span
                className="text-4xl font-extrabold"
                style={{ fontFamily: "var(--font-heading)", color: "var(--cc-accent)" }}
              >
                {streak}
              </span>
              <span className="text-sm" style={{ color: "var(--cc-text-secondary)" }}>
                day streak
              </span>
            </motion.div>
          ) : (
            <p className="text-xl font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--cc-text)" }}>
              No streak yet
            </p>
          )}
        </div>

        {/* Day of Year Ring */}
        {streak > 0 && (
          <motion.div
            className="relative flex-shrink-0"
            style={{ width: size, height: size }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {/* Glow effect behind the ring */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(212,168,83,0.3) 0%, transparent 70%)",
                filter: "blur(8px)",
              }}
            />
            <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
              <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none"
                stroke="var(--cc-border)"
                strokeWidth={strokeWidth}
              />
              <motion.circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none"
                stroke="var(--cc-accent)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{
                  filter: "drop-shadow(0 0 6px rgba(212,168,83,0.5))",
                }}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-lg font-bold"
                style={{ fontFamily: "var(--font-heading)", color: "var(--cc-text)" }}
              >
                {dayOfYear}
              </span>
              <span className="text-[9px]" style={{ color: "var(--cc-text-secondary)" }}>/ {daysInYear}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom section */}
      <div className="space-y-2">
        {/* 7-day sparkline */}
        {weeklyData.length > 0 && (
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <span
              className="text-[10px] uppercase tracking-wider"
              style={{ color: "var(--cc-text-secondary)" }}
            >
              7-day
            </span>
            <Sparkline data={weeklyData} width={80} height={24} color="var(--cc-accent)" />
          </motion.div>
        )}
        <motion.p
          className="text-xs italic"
          style={{ fontFamily: "var(--font-heading)", color: "var(--cc-text-secondary)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: mounted ? 1 : 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {tagline}
        </motion.p>
      </div>
    </motion.div>
  );
}

export function TodayCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border p-5 min-h-[200px] animate-pulse"
      style={{ backgroundColor: "var(--cc-card)", borderColor: "var(--cc-border)" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-3 w-32 mb-3 rounded" style={{ backgroundColor: "var(--cc-bg)" }} />
          <div className="h-10 w-24 rounded" style={{ backgroundColor: "var(--cc-bg)" }} />
        </div>
        <div className="rounded-full border-4" style={{ width: 100, height: 100, borderColor: "var(--cc-border)" }} />
      </div>
      <div className="space-y-2">
        <div className="h-6 w-24 rounded" style={{ backgroundColor: "var(--cc-bg)" }} />
        <div className="h-4 w-full rounded" style={{ backgroundColor: "var(--cc-bg)" }} />
      </div>
    </motion.div>
  );
}