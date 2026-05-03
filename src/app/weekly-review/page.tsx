'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, History, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { WeeklyReviewStats } from '@/components/weekly-review/WeeklyReviewStats';
import { WeeklyReviewForm } from '@/components/weekly-review/WeeklyReviewForm';
import { getCurrentWeekKey, getWeekDates } from '@/lib/dateUtils';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface AutoStats {
    tasksCompleted: number;
    tasksTotal: number;
    dailyHabitCompliance: number;
    weeklyHabitCompliance: number;
    gymSessions: number;
    totalWorkoutMinutes: number;
    expensesTotal: number;
    incomeTotal: number;
    netCashflow: number;
}

interface FormData {
    wins: string;
    challenges: string;
    lessonsLearned: string;
    nextWeekActions: string;
    mood: string | null;
    energy: string | null;
    focus: string | null;
    notableDays: any[];
}

export default function WeeklyReviewPage() {
    const [currentWeek, setCurrentWeek] = useState(getCurrentWeekKey());
    const [review, setReview] = useState<any>(null);
    const [autoStats, setAutoStats] = useState<AutoStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [reviewHistory, setReviewHistory] = useState<any[]>([]);

    const [formData, setFormData] = useState<FormData>({
        wins: '',
        challenges: '',
        lessonsLearned: '',
        nextWeekActions: '',
        mood: null,
        energy: null,
        focus: null,
        notableDays: [],
    });

    const weekLabel = (wk: string) => {
        const { start } = getWeekDates(wk);
        return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const fetchReview = async (weekKey: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/weekly-reviews/${weekKey}`);
            const json = await res.json();
            if (json.success && json.data) {
                setReview(json.data);
                setAutoStats(json.data.autoStats);
                setFormData({
                    wins: json.data.wins ?? '',
                    challenges: json.data.challenges ?? '',
                    lessonsLearned: json.data.lessonsLearned ?? '',
                    nextWeekActions: json.data.nextWeekActions ?? '',
                    mood: json.data.mood ?? null,
                    energy: json.data.energy ?? null,
                    focus: json.data.focus ?? null,
                    notableDays: json.data.notableDays ?? [],
                });
            } else {
                setReview(null);
                await fetchAutoStats(weekKey);
                setFormData({ wins: '', challenges: '', lessonsLearned: '', nextWeekActions: '', mood: null, energy: null, focus: null, notableDays: [] });
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchAutoStats = async (weekKey: string) => {
        const tempRes = await fetch('/api/weekly-reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ weekKey, wins: '', challenges: '', lessonsLearned: '', nextWeekActions: '', mood: null, energy: null, focus: null, notableDays: [] }),
        });
        const tempJson = await tempRes.json();
        if (tempJson.success) {
            setAutoStats(tempJson.data.autoStats);
        }
    };

    const fetchHistory = async () => {
        const res = await fetch('/api/weekly-reviews');
        const json = await res.json();
        if (json.success) setReviewHistory(json.data);
    };

    useEffect(() => {
        fetchReview(currentWeek);
        fetchHistory();
    }, [currentWeek]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch('/api/weekly-reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weekKey: currentWeek, ...formData }),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            fetchHistory();
        } finally {
            setSaving(false);
        }
    };

    const navigateWeek = (direction: number) => {
        const { start } = getWeekDates(currentWeek);
        start.setDate(start.getDate() + direction * 7);
        const t = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
        const day = t.getUTCDay() || 7;
        t.setUTCDate(t.getUTCDate() + 4 - day);
        const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
        const weekNum = Math.ceil((((t.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        setCurrentWeek(`${t.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-gray-500" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigateWeek(-1)}
                        className="p-2 text-gray-500 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <div className="text-xs text-gray-500 font-light">{currentWeek}</div>
                        <h1 className="text-2xl font-bold text-white">{weekLabel(currentWeek)}</h1>
                    </div>
                    <button
                        onClick={() => navigateWeek(1)}
                        className="p-2 text-gray-500 hover:text-white transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                    {currentWeek !== getCurrentWeekKey() && (
                        <button
                            onClick={() => setCurrentWeek(getCurrentWeekKey())}
                            className="text-xs text-gray-500 hover:text-gray-300 underline"
                        >
                            Today
                        </button>
                    )}
                </div>
                {/* History Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white text-sm transition-all"
                    >
                        <History size={16} />
                        History
                    </button>
                    {showHistory && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute right-0 top-full mt-2 w-56 bg-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                        >
                            {reviewHistory.length === 0 ? (
                                <div className="p-4 text-xs text-gray-500 text-center">No saved reviews yet</div>
                            ) : (
                                reviewHistory.map((r: any) => (
                                    <button
                                        key={r.weekKey}
                                        onClick={() => { setCurrentWeek(r.weekKey); setShowHistory(false); }}
                                        className={cn(
                                            "w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors border-b border-white/5 last:border-0",
                                            r.weekKey === currentWeek ? "text-primary" : "text-gray-300"
                                        )}
                                    >
                                        <div className="font-medium">{weekLabel(r.weekKey)}</div>
                                        <div className="text-xs text-gray-500">{r.weekKey}</div>
                                    </button>
                                ))
                            )}
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Two-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left — Stats (2/5 width) */}
                <div className="lg:col-span-2">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Week at a Glance</h2>
                    {autoStats ? (
                        <WeeklyReviewStats stats={autoStats} />
                    ) : (
                        <div className="text-sm text-gray-500">No data available for this week</div>
                    )}
                </div>

                {/* Right — Form (3/5 width) */}
                <div className="lg:col-span-3">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Weekly Reflection</h2>
                    <div className="bg-surface/20 backdrop-blur-xl border border-white/5 rounded-2xl p-6 space-y-6">
                        <WeeklyReviewForm
                            weekKey={currentWeek}
                            data={formData}
                            onChange={setFormData}
                            onSave={handleSave}
                            saving={saving}
                            saved={saved}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}