'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getWeekDays } from '@/lib/dateUtils';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface NotableDay {
    date: string;
    label: string;
    notes: string;
    highlights: string;
}

interface Props {
    weekKey: string;
    days: NotableDay[];
    onChange: (days: NotableDay[]) => void;
}

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const NotableDayEditor = ({ weekKey, days, onChange }: Props) => {
    const [openDay, setOpenDay] = useState<number | null>(null);

    const getDayDate = (index: number): string => {
        const weekDays = getWeekDays(weekKey);
        return weekDays[index].toISOString().split('T')[0];
    };

    const updateDay = (index: number, field: 'notes' | 'highlights', value: string) => {
        const newDays = [...days];
        if (!newDays[index]) {
            newDays[index] = { date: getDayDate(index), label: DAY_LABELS[index], notes: '', highlights: '' };
        }
        newDays[index] = { ...newDays[index], [field]: value };
        onChange(newDays);
    };

    const getDayValue = (index: number, field: 'notes' | 'highlights'): string => {
        return days[index]?.[field] ?? '';
    };

    return (
        <div className="space-y-2">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Notable Days</div>
            <div className="flex flex-col gap-2">
                {DAY_LABELS.map((label, i) => {
                    const isOpen = openDay === i;
                    const hasContent = days[i]?.notes || days[i]?.highlights;
                    return (
                        <div key={i} className="w-full">
                            <button
                                onClick={() => setOpenDay(isOpen ? null : i)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all text-left text-sm",
                                    isOpen ? "bg-white/5 border-white/10 text-white" : "border-white/5 text-gray-400 hover:border-white/10 hover:text-gray-300"
                                )}
                            >
                                <span>{label}</span>
                                <div className="flex items-center gap-2">
                                    {hasContent && !isOpen && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    )}
                                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </div>
                            </button>
                            {isOpen && (
                                <div className="mt-2 space-y-2 pl-1">
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">What happened?</label>
                                        <textarea
                                            value={getDayValue(i, 'notes')}
                                            onChange={(e) => updateDay(i, 'notes', e.target.value)}
                                            placeholder="Notes for this day..."
                                            rows={2}
                                            className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-600 resize-none focus:outline-none focus:border-white/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">Highlights</label>
                                        <textarea
                                            value={getDayValue(i, 'highlights')}
                                            onChange={(e) => updateDay(i, 'highlights', e.target.value)}
                                            placeholder="Best moments..."
                                            rows={1}
                                            className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-600 resize-none focus:outline-none focus:border-white/20"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};