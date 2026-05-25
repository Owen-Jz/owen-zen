'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, ChevronDown, ChevronUp, RefreshCw, ExternalLink, AlertCircle, Plus, X, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

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
    account: string;
  };
  error?: string;
}

function formatEventTime(isoString: string): string {
  // Parse timezone offset directly from ISO string to avoid browser local-time confusion
  // Google Calendar returns e.g. "2026-05-25T13:00:00+01:00" — we want the hour in that timezone
  const match = isoString.match(/T(\d{2}):(\d{2}):\d{2}([+-]\d{2}):(\d{2})/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }
  // Fallback: legacy all-day event (date only, no time)
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

function AccountSection({
  account,
  label,
  icon: Icon,
}: {
  account: 'personal' | 'work';
  label: string;
  icon: React.ElementType;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch, isFetching } = useQuery<EventsResponse>({
    queryKey: ['calendar-events', account],
    queryFn: () => fetch(`/api/calendar/events?account=${account}`).then(r => r.json()),
    staleTime: 1000 * 60 * 5,
  });

  const events = data?.data?.events ?? [];
  const hasEvents = events.length > 0;

  return (
    <div className="space-y-1">
      {/* Account Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-2 py-2.5 rounded-lg border border-white/5 hover:bg-white/5 transition-all group"
      >
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-gray-500" />
          <span className="text-xs font-bold text-gray-300 tracking-tight">
            {label}
          </span>
          {!isExpanded && hasEvents && !isLoading && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-surface border border-border text-gray-500">
              {events.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {isFetching && !isLoading && (
            <RefreshCw size={12} className="animate-spin text-gray-500" />
          )}
          {isExpanded ? (
            <ChevronUp size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
          ) : (
            <ChevronDown size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
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
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="pl-4 pb-1 space-y-0.5">
              {/* Loading */}
              {isLoading && (
                <div className="space-y-1.5 px-1 py-2">
                  {[1, 2].map(i => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="h-2.5 w-10 rounded bg-white/5" />
                      <div className="h-2.5 flex-1 rounded bg-white/5" />
                    </div>
                  ))}
                </div>
              )}

              {/* Error */}
              {isError && (
                <div className="flex flex-col items-center gap-1.5 py-3 px-1">
                  <AlertCircle size={12} className="text-red-400" />
                  <span className="text-[10px] text-gray-600">Failed to load</span>
                  <button
                    onClick={() => refetch()}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-surface border border-border text-gray-500 hover:bg-white/5 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Empty */}
              {!isLoading && !isError && events.length === 0 && (
                <div className="py-2.5 text-center">
                  <span className="text-[10px] italic text-gray-600">No upcoming events</span>
                </div>
              )}

              {/* Events */}
              {!isLoading && !isError && events.length > 0 && (
                <div className="space-y-0.5">
                  {events.map(event => (
                    <button
                      key={event.id}
                      onClick={() => window.open(event.htmlLink, '_blank')}
                      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors text-left group/event"
                    >
                      <div className="flex flex-col items-start w-12 shrink-0">
                        <span className="text-[10px] font-mono font-medium text-gray-500">
                          {formatEventTime(event.start)}
                        </span>
                        <span className="text-[9px] text-gray-600">
                          {formatEventDate(event.start)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 flex-1 truncate group-hover/event:text-gray-200 transition-colors">
                        {event.title}
                      </span>
                      <ExternalLink size={9} className="text-gray-700 group-hover/event:text-gray-500 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function UpcomingEvents() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventDuration, setNewEventDuration] = useState('60');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [activeAccount, setActiveAccount] = useState<'personal' | 'work'>('personal');

  const queryClient = useQueryClient();

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate || !newEventTime) return;

    setIsCreating(true);
    setCreateError('');

    const startDateTime = new Date(`${newEventDate}T${newEventTime}`);
    const endDateTime = new Date(startDateTime.getTime() + parseInt(newEventDuration) * 60 * 1000);

    try {
      const res = await fetch(`/api/calendar/events?account=${activeAccount}`, {
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
        queryClient.invalidateQueries({ queryKey: ['calendar-events', activeAccount] });
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
          className="flex-1 flex items-center justify-between px-2 py-3 rounded-xl border border-white/5 hover:bg-white/5 transition-all group"
        >
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-gray-400" />
            <span className="text-sm font-bold text-gray-200 tracking-tight">
              Upcoming Events
            </span>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw size={14} className="text-gray-600" />
            <ChevronDown size={16} className="text-gray-500" />
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

      {/* Account Sections */}
      <div className="pt-3 pl-2 space-y-1">
        <AccountSection account="personal" label="Personal" icon={Calendar} />
        <AccountSection account="work" label="Work" icon={Briefcase} />
      </div>

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
                {/* Account Selector */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Account</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveAccount('personal')}
                      className={cn(
                        'flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
                        activeAccount === 'personal'
                          ? 'border-primary bg-primary/10 text-white'
                          : 'border-border text-gray-400 hover:bg-white/5'
                      )}
                    >
                      <Calendar size={14} className="inline mr-1.5" />
                      Personal
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAccount('work')}
                      className={cn(
                        'flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
                        activeAccount === 'work'
                          ? 'border-primary bg-primary/10 text-white'
                          : 'border-border text-gray-400 hover:bg-white/5'
                      )}
                    >
                      <Briefcase size={14} className="inline mr-1.5" />
                      Work
                    </button>
                  </div>
                </div>

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