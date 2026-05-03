'use client';

import { Check } from 'lucide-react';
import { NotableDayEditor } from './NotableDayEditor';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
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

interface Props {
    weekKey: string;
    data: FormData;
    onChange: (data: FormData) => void;
    onSave: () => void;
    saving: boolean;
    saved: boolean;
}

const MOOD_OPTIONS = [
    { value: 'great', label: 'Great', emoji: '😊' },
    { value: 'good', label: 'Good', emoji: '🙂' },
    { value: 'okay', label: 'Okay', emoji: '😐' },
    { value: 'rough', label: 'Rough', emoji: '😔' },
    { value: 'terrible', label: 'Terrible', emoji: '😞' },
];
const ENERGY_OPTIONS = [
    { value: 'high', label: 'High', color: 'text-green-400' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-400' },
    { value: 'low', label: 'Low', color: 'text-red-400' },
];
const FOCUS_OPTIONS = [
    { value: 'sharp', label: 'Sharp', color: 'text-blue-400' },
    { value: 'moderate', label: 'Moderate', color: 'text-yellow-400' },
    { value: 'scattered', label: 'Scattered', color: 'text-red-400' },
];

export const WeeklyReviewForm = ({ weekKey, data, onChange, onSave, saving, saved }: Props) => {
    const update = (field: keyof FormData, value: any) => onChange({ ...data, [field]: value });

    const section = (label: string, field: keyof FormData, placeholder: string) => (
        <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{label}</div>
            <textarea
                value={data[field] as string}
                onChange={(e) => update(field, e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-white/20 transition-all"
            />
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Quick Status */}
            <div className="space-y-3">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Quick Status</div>
                <div className="flex flex-wrap gap-4">
                    {/* Mood */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Mood:</span>
                        <div className="flex gap-1">
                            {MOOD_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => update('mood', data.mood === opt.value ? null : opt.value)}
                                    title={opt.label}
                                    className={cn(
                                        "w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all",
                                        data.mood === opt.value
                                            ? "bg-primary/30 ring-1 ring-primary text-white"
                                            : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
                                    )}
                                >
                                    {opt.emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Energy */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Energy:</span>
                        <div className="flex gap-1">
                            {ENERGY_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => update('energy', data.energy === opt.value ? null : opt.value)}
                                    className={cn(
                                        "px-2 py-1 rounded text-xs font-medium transition-all",
                                        data.energy === opt.value
                                            ? `bg-white/10 ring-1 ring-white/20 ${opt.color}`
                                            : "bg-white/5 text-gray-500 hover:bg-white/10"
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Focus */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Focus:</span>
                        <div className="flex gap-1">
                            {FOCUS_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => update('focus', data.focus === opt.value ? null : opt.value)}
                                    className={cn(
                                        "px-2 py-1 rounded text-xs font-medium transition-all",
                                        data.focus === opt.value
                                            ? `bg-white/10 ring-1 ring-white/20 ${opt.color}`
                                            : "bg-white/5 text-gray-500 hover:bg-white/10"
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {section('Wins', 'wins', 'What went well this week?')}
            {section('Challenges', 'challenges', 'What was difficult?')}
            {section('Lessons Learned', 'lessonsLearned', 'What did you learn?')}
            {section('Next Week Actions', 'nextWeekActions', 'What will you do differently next week?')}

            {/* Notable Days */}
            <NotableDayEditor
                weekKey={weekKey}
                days={data.notableDays}
                onChange={(newDays) => update('notableDays', newDays)}
            />

            {/* Save Button */}
            <div className="pt-4">
                <button
                    onClick={onSave}
                    disabled={saving}
                    className={cn(
                        "w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                        saved
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-white"
                    )}
                >
                    {saved ? (
                        <>
                            <Check size={16} />
                            Saved
                        </>
                    ) : saving ? (
                        "Saving..."
                    ) : (
                        "Save Review"
                    )}
                </button>
            </div>
        </div>
    );
};