"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, BookOpen, Plus, Calendar } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { JournalHeatmap } from "./journal/JournalHeatmap";
import { JournalEntryModal } from "./journal/JournalEntryModal";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface Entry {
  _id: string;
  date: string;
  text: string;
  mood: number;
  tags: string[];
  updatedAt: string;
}

interface JournalData {
  success: boolean;
  data: Entry[];
  stats: { currentStreak: number; longestStreak: number; totalEntries: number };
}

async function fetchJournal(year: number, search: string, tag: string): Promise<JournalData> {
  const params = new URLSearchParams({ year: year.toString() });
  if (search) params.set('search', search);
  if (tag) params.set('tag', tag);
  const res = await fetch(`/api/journal?${params}`);
  return res.json();
}

export default function JournalView() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['journal', year, searchQuery, activeTag ?? ''],
    queryFn: () => fetchJournal(year, searchQuery, activeTag ?? ''),
  });

  const saveMutation = useMutation({
    mutationFn: async (body: { date: string; text: string; mood: number; tags: string[] }) => {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
    },
  });

  const entriesMap = useMemo(() => {
    const map: Record<string, Entry> = {};
    data?.data?.forEach((e: Entry) => { map[e.date] = e; });
    return map;
  }, [data?.data]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    data?.data?.forEach((e: Entry) => e.tags.forEach((t: string) => tags.add(t)));
    return Array.from(tags).sort();
  }, [data?.data]);

  const selectedEntry = selectedDate ? (entriesMap[selectedDate] ?? null) : null;

  const handleSave = (formData: { text: string; mood: number; tags: string[] }) => {
    if (!selectedDate) return;
    saveMutation.mutate({ date: selectedDate, ...formData });
  };

  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  const sortedEntries = useMemo(() => {
    return [...(data?.data ?? [])].sort((a, b) => b.date.localeCompare(a.date));
  }, [data?.data]);

  const MOOD_COLORS: Record<number, string> = {
    1: '#c0392b', 2: '#e74c3c', 3: '#f39c12', 4: '#2ecc71', 5: '#27ae60',
  };
  const MOOD_LABELS = ['', 'Terrible', 'Bad', 'Okay', 'Good', 'Great'];

  function formatCardDate(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            📓 Journal
          </h1>
          {data?.stats && (
            <p className="text-sm text-gray-400 mt-1">
              {data.stats.totalEntries} entries · 🔥 {data.stats.currentStreak} day streak · Best: {data.stats.longestStreak} days
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setYear(new Date().getFullYear());
              setSelectedDate(new Date().toISOString().split('T')[0]);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 rounded-lg text-sm font-bold text-white transition-colors"
          >
            <Plus size={16} />
            Today's Entry
          </button>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
          >
            {years.map(y => (
              <option key={y} value={y} className="bg-gray-900">{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Search and tags */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search entries..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveTag(null)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all",
                !activeTag ? "bg-primary text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
              )}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all",
                  activeTag === tag ? "bg-primary text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Heatmap */}
      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="text-gray-500 text-sm">Loading...</div>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <JournalHeatmap
            year={year}
            entries={entriesMap}
            onDateClick={setSelectedDate}
          />
        </div>
      )}

      {/* Entry List */}
      {sortedEntries.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-gray-500" />
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Entries</h2>
            <span className="text-xs text-gray-600">({sortedEntries.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortedEntries.map(entry => (
              <button
                key={entry._id}
                onClick={() => setSelectedDate(entry.date)}
                className="text-left bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-white/20 transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-sm font-bold text-white">{formatCardDate(entry.date)}</span>
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: MOOD_COLORS[entry.mood] ?? '#666' }}
                    title={MOOD_LABELS[entry.mood]}
                  />
                </div>
                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {entry.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-1.5 py-0.5 bg-primary/15 text-primary text-xs rounded">
                        {tag}
                      </span>
                    ))}
                    {entry.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{entry.tags.length - 3}</span>
                    )}
                  </div>
                )}
                {entry.text && (
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                    {entry.text}
                  </p>
                )}
                {!entry.text && (
                  <p className="text-xs text-gray-600 italic">No entry text</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {data?.data && data.data.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">No entries yet. Click "Today's Entry" to start journaling!</p>
        </div>
      )}

      {/* Modal */}
      {selectedDate && (
        <JournalEntryModal
          date={selectedDate}
          entry={selectedEntry}
          onClose={() => setSelectedDate(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}