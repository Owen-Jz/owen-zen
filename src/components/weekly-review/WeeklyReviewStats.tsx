'use client';

import { Target, TrendingUp, Flame, Calendar, Trophy } from 'lucide-react';
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

interface Props {
    stats: AutoStats;
}

export const WeeklyReviewStats = ({ stats }: Props) => {
    const taskRate = stats.tasksTotal > 0 ? Math.round((stats.tasksCompleted / stats.tasksTotal) * 100) : 0;

    return (
        <div className="space-y-4">
            {/* Tasks */}
            <div className="bg-surface/40 backdrop-blur-md border border-white/5 rounded-xl p-5 hover:border-blue-500/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="text-sm text-gray-400 font-light mb-1">Tasks</div>
                        <div className="text-2xl font-bold text-white">
                            {stats.tasksCompleted} <span className="text-gray-500 text-base font-medium">/ {stats.tasksTotal}</span>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Target size={20} className="text-blue-500" />
                    </div>
                </div>
                <div className="w-full bg-black/40 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${taskRate}%` }} />
                </div>
                <div className="text-right mt-2 text-xs text-blue-500 font-bold">{taskRate}% Complete</div>
            </div>

            {/* Daily Habits */}
            <div className="bg-surface/40 backdrop-blur-md border border-white/5 rounded-xl p-5 hover:border-green-500/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="text-sm text-gray-400 font-light mb-1">Daily Habits</div>
                        <div className="text-2xl font-bold text-white">{stats.dailyHabitCompliance}%</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <TrendingUp size={20} className="text-green-500" />
                    </div>
                </div>
                <div className="w-full bg-black/40 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${stats.dailyHabitCompliance}%` }} />
                </div>
                <div className="text-right mt-2 text-xs text-green-500 font-bold">Compliance this week</div>
            </div>

            {/* Weekly Habits */}
            <div className="bg-surface/40 backdrop-blur-md border border-white/5 rounded-xl p-5 hover:border-cyan-500/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="text-sm text-gray-400 font-light mb-1">Weekly Habits</div>
                        <div className="text-2xl font-bold text-white">{stats.weeklyHabitCompliance}%</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <Calendar size={20} className="text-cyan-500" />
                    </div>
                </div>
                <div className="w-full bg-black/40 rounded-full h-2">
                    <div className="bg-cyan-500 h-2 rounded-full transition-all duration-500" style={{ width: `${stats.weeklyHabitCompliance}%` }} />
                </div>
                <div className="text-right mt-2 text-xs text-cyan-500 font-bold">Completed this week</div>
            </div>

            {/* Gym */}
            <div className="bg-surface/40 backdrop-blur-md border border-white/5 rounded-xl p-5 hover:border-orange-500/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="text-sm text-gray-400 font-light mb-1">Gym Sessions</div>
                        <div className="text-2xl font-bold text-white">{stats.gymSessions}</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <Flame size={20} className="text-orange-500" />
                    </div>
                </div>
                <div className="text-right mt-2 text-xs text-orange-500 font-bold">{stats.totalWorkoutMinutes} min total</div>
            </div>

            {/* Finance */}
            <div className="bg-surface/40 backdrop-blur-md border border-white/5 rounded-xl p-5 hover:border-yellow-500/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="text-sm text-gray-400 font-light mb-1">Finance</div>
                        <div className="text-xl font-bold text-white">
                            {stats.netCashflow >= 0 ? '+' : ''}{stats.netCashflow.toLocaleString()}
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <Trophy size={20} className="text-yellow-500" />
                    </div>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Expenses: <span className="text-gray-300">${stats.expensesTotal.toLocaleString()}</span></span>
                    <span className="text-gray-500">Income: <span className="text-green-400">${stats.incomeTotal.toLocaleString()}</span></span>
                </div>
            </div>
        </div>
    );
};