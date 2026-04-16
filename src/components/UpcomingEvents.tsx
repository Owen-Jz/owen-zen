'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, ChevronDown, ChevronUp, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

export function UpcomingEvents() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<EventsResponse>({
    queryKey: ['calendar-events'],
    queryFn: () => fetch('/api/calendar/events').then(r => r.json()),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const events = data?.data?.events ?? [];
  const hasEvents = events.length > 0;

  return (
    <div className="mb-8">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-2 py-3 rounded-xl border border-white/5 hover:bg-white/5 transition-all group"
      >
        <div className="flex items-center gap-3">
          <Calendar size={16} className="text-gray-400" />
          <span className="text-sm font-bold text-gray-200 tracking-tight">
            Upcoming Events
          </span>
          {!isExpanded && hasEvents && !isLoading && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-surface border border-border text-gray-400">
              {events.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isFetching && !isLoading && (
            <RefreshCw size={14} className="animate-spin text-gray-500" />
          )}
          {isExpanded ? (
            <ChevronUp size={16} className="text-gray-500 group-hover:text-gray-300 transition-colors" />
          ) : (
            <ChevronDown size={16} className="text-gray-500 group-hover:text-gray-300 transition-colors" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="pt-3 space-y-1">
              {/* Loading */}
              {isLoading && (
                <div className="space-y-2 px-1 py-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="h-3 w-12 rounded bg-white/5" />
                      <div className="h-3 flex-1 rounded bg-white/5" />
                    </div>
                  ))}
                </div>
              )}

              {/* Error */}
              {isError && (
                <div className="flex flex-col items-center gap-2 py-4 px-2">
                  <AlertCircle size={16} className="text-red-400" />
                  <span className="text-xs text-gray-500">Failed to load events</span>
                  <button
                    onClick={() => refetch()}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-surface border border-border text-gray-400 hover:bg-white/5 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Empty */}
              {!isLoading && !isError && events.length === 0 && (
                <div className="py-4 text-center">
                  <span className="text-sm italic text-gray-600">No upcoming events</span>
                </div>
              )}

              {/* Events */}
              {!isLoading && !isError && events.length > 0 && (
                <div className="space-y-0.5">
                  {events.map(event => (
                    <button
                      key={event.id}
                      onClick={() => window.open(event.htmlLink, '_blank')}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group/event"
                    >
                      <span className="text-xs font-mono font-medium text-gray-500 w-14 shrink-0">
                        {formatEventTime(event.start)}
                      </span>
                      <span className="text-sm text-gray-300 flex-1 truncate group-hover/event:text-white transition-colors">
                        {event.title}
                      </span>
                      <ExternalLink size={11} className="text-gray-600 group-hover/event:text-gray-400 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Footer */}
              {!isLoading && !isError && hasEvents && (
                <div className="pt-3 mt-2 border-t border-white/5">
                  <a
                    href="https://calendar.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Open Google Calendar
                    <ExternalLink size={10} />
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}