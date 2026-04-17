'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, ChevronDown, ChevronUp, RefreshCw, ExternalLink, AlertCircle, Plus, X } from 'lucide-react';
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

function formatEventDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function UpcomingEvents() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventDuration, setNewEventDuration] = useState('60'); // minutes
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<EventsResponse>({
    queryKey: ['calendar-events'],
    queryFn: () => fetch('/api/calendar/events').then(r => r.json()),
    staleTime: 1000 * 60 * 5,
  });

  const events = data?.data?.events ?? [];
  const hasEvents = events.length > 0;

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate || !newEventTime) return;

    setIsCreating(true);
    setCreateError('');

    const startDateTime = new Date(`${newEventDate}T${newEventTime}`);
    const endDateTime = new Date(startDateTime.getTime() + parseInt(newEventDuration) * 60 * 1000);

    try {
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newEventTitle.trim(),
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
        }),
      });
      const json = await res.json();

      if (json.success) {
        setShowAddModal(false);
        setNewEventTitle('');
        setNewEventDate('');
        setNewEventTime('');
        setNewEventDuration('60');
        refetch(); // Refresh the event list
      } else {
        setCreateError(json.error || 'Failed to create event');
      }
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create event');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mb-8">
      {/* Collapsible Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 flex items-center justify-between px-2 py-3 rounded-xl border border-white/5 hover:bg-white/5 transition-all group"
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

        {/* Add Event Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="p-2.5 rounded-xl border border-white/5 hover:bg-white/5 transition-all group"
          title="Add event"
        >
          <Plus size={16} className="text-gray-400 group-hover:text-gray-200 transition-colors" />
        </button>
      </div>

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
                      <div className="flex flex-col items-start w-14 shrink-0">
                        <span className="text-xs font-mono font-medium text-gray-500">
                          {formatEventTime(event.start)}
                        </span>
                        <span className="text-[10px] text-gray-600">
                          {formatEventDate(event.start)}
                        </span>
                      </div>
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

      {/* Add Event Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60"
            onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Create Event</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Event Title</label>
                  <input
                    type="text"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="Team standup"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-colors"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Date</label>
                    <input
                      type="date"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Time</label>
                    <input
                      type="time"
                      value={newEventTime}
                      onChange={(e) => setNewEventTime(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Duration</label>
                  <select
                    value={newEventDuration}
                    onChange={(e) => setNewEventDuration(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>

                {createError && (
                  <p className="text-xs text-red-400">{createError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-gray-400 hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newEventTitle.trim() || !newEventDate || !newEventTime || isCreating}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    {isCreating ? 'Creating...' : 'Create Event'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
