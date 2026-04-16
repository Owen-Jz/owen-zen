// src/components/canvas/EventsCenter.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Calendar, RefreshCw, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  htmlLink: string;
  colorId?: string;
}

interface EventsResponse {
  success: boolean;
  data: {
    events: CalendarEvent[];
    isIncremental: boolean;
  };
  error?: string;
}

function formatEventTime(isoString: string): string {
  const date = new Date(isoString);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-1 py-2">
      <div
        className="h-4 w-12 rounded animate-pulse"
        style={{ background: 'var(--gray-800)' }}
      />
      <div
        className="h-4 flex-1 rounded animate-pulse"
        style={{ background: 'var(--gray-800)' }}
      />
    </div>
  );
}

export function EventsCenter() {
  const { data, isLoading, isError, error, refetch } = useQuery<EventsResponse>({
    queryKey: ['calendar-events'],
    queryFn: () => fetch('/api/calendar/events').then(r => r.json()),
  });

  const events = data?.data?.events ?? [];
  const upcomingEvents = events.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed top-4 right-4 z-50 w-72 rounded-2xl border shadow-2xl overflow-hidden"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <Calendar size={14} style={{ color: 'var(--primary)' }} />
          <span className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
            Upcoming
          </span>
          {!isLoading && !isError && upcomingEvents.length > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
              style={{ background: 'var(--gray-800)', color: 'var(--gray-400)' }}
            >
              {upcomingEvents.length}
            </span>
          )}
        </div>
        <button
          onClick={() => refetch()}
          className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: 'var(--gray-500)' }}
          aria-label="Refresh events"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-2 min-h-[120px]">
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-1"
            >
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </motion.div>
          )}

          {isError && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-2 py-4"
            >
              <span className="text-xs" style={{ color: 'var(--color-error)' }}>
                {(error as Error)?.message || 'Failed to load events'}
              </span>
              <button
                onClick={() => refetch()}
                className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: 'var(--gray-800)',
                  color: 'var(--gray-400)',
                }}
              >
                Retry
              </button>
            </motion.div>
          )}

          {!isLoading && !isError && upcomingEvents.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-20"
            >
              <span className="text-sm italic" style={{ color: 'var(--gray-600)' }}>
                No upcoming events
              </span>
            </motion.div>
          )}

          {!isLoading && !isError && upcomingEvents.length > 0 && (
            <motion.div
              key="events"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-0.5"
            >
              {upcomingEvents.map((event) => (
                <motion.button
                  key={event.id}
                  initial={{ opacity: 0, x: 4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                  onClick={() => window.open(event.htmlLink, '_blank')}
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.15 }}
                >
                  <span
                    className="text-xs font-medium truncate"
                    style={{ color: 'var(--gray-300)' }}
                  >
                    {formatEventTime(event.start)} — {event.title}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div
        className="px-4 py-2 border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <a
          href="https://calendar.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-xs hover:underline transition-colors"
          style={{ color: 'var(--gray-500)' }}
        >
          Open Google Calendar
          <ExternalLink size={10} />
        </a>
      </div>
    </motion.div>
  );
}