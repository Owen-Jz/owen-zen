"use client";

import { useState, useEffect, useMemo } from "react";
import { Flame, Trophy, Target, Zap, Sunrise, Mountain, Link2, Sparkles, Crown, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface Habit {
    _id: string;
    title: string;
    description?: string;
    category: string;
    streak: number;
    completedDates: string[];
}

// Cache formatter
const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
});

const toLocalString = (d: Date | string) => {
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    const parts = formatter.formatToParts(dateObj);
    const yr = parts.find(p => p.type === 'year')?.value;
    const mo = parts.find(p => p.type === 'month')?.value;
    const da = parts.find(p => p.type === 'day')?.value;
    return `${yr}-${mo}-${da}`;
};

const CHALLENGE_DURATION = 90;

export const DisciplineChallenge = () => {
    const [habit, setHabit] = useState<Habit | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Calculate challenge progress from habit data
    const challengeData = useMemo(() => {
        if (!habit || !habit.completedDates?.length) {
            return {
                currentStreak: 0,
                progress: 0,
                isCompleted: false,
                hasRelapsed: false,
                completionPercentage: 0,
            };
        }

        const today = toLocalString(new Date());
        const yesterday = toLocalString(new Date(Date.now() - 86400000));

        // Get all completed dates sorted
        const completedDates = [...habit.completedDates]
            .map(d => toLocalString(d))
            .sort()
            .reverse(); // Most recent first

        // Check if today or yesterday is completed (active streak)
        const hasToday = completedDates.includes(today);
        const hasYesterday = completedDates.includes(yesterday);

        // Calculate current consecutive streak from most recent completion
        let currentStreak = 0;
        let checkDate = hasToday ? today : (hasYesterday ? yesterday : null);

        if (checkDate) {
            currentStreak = 1;
            let prevDate = new Date(checkDate);

            while (true) {
                prevDate = new Date(prevDate.getTime() - 86400000);
                const prevDateStr = toLocalString(prevDate);
                if (completedDates.includes(prevDateStr)) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }

        // Calculate challenge progress (cap at 90 days)
        const challengeProgress = Math.min(currentStreak, CHALLENGE_DURATION);
        const completionPercentage = (challengeProgress / CHALLENGE_DURATION) * 100;
        const isCompleted = currentStreak >= CHALLENGE_DURATION;

        // Check for relapse: if last completed date is not today or yesterday
        const lastCompleted = completedDates[0];
        const hasRelapsed = lastCompleted && lastCompleted !== today && lastCompleted !== yesterday;

        return {
            currentStreak,
            progress: challengeProgress,
            isCompleted,
            hasRelapsed,
            completionPercentage,
        };
    }, [habit]);

    const fetchHabit = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/habits");
            const json = await res.json();

            if (json.success && json.data) {
                // Find the "Control Dopamine" habit
                const dopamineHabit = json.data.find(
                    (h: Habit) => h.title.toLowerCase().includes("control dopamine") ||
                                 h.title.toLowerCase().includes("no porn") ||
                                 h.title.toLowerCase().includes("no junk")
                );

                if (dopamineHabit) {
                    setHabit(dopamineHabit);
                } else {
                    // Use first available habit if "Control Dopamine" doesn't exist
                    setHabit(json.data[0] || null);
                }
            }
        } catch (err) {
            setError("Failed to load habit data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHabit();
        // Refresh every minute
        const interval = setInterval(fetchHabit, 60000);
        return () => clearInterval(interval);
    }, []);

    // Calculate mud layers (more dramatic reveal as progress increases)
    const getMudOpacity = () => {
        const progress = challengeData.progress;
        if (progress >= 90) return 0;
        // Exponential decay for more dramatic effect
        return Math.pow(1 - progress / 90, 1.5);
    };

    const getCrackIntensity = () => {
        const progress = challengeData.progress;
        if (progress < 10) return 0;
        return Math.min((progress - 10) / 40, 1);
    };

    const mudOpacity = getMudOpacity();
    const crackIntensity = getCrackIntensity();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    if (error || !habit) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
                <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">No Habit Found</h2>
                <p className="text-gray-400">Please add the "Control Dopamine" habit in the Habits section first.</p>
            </div>
        );
    }

    return (
        <div className="min-h-full p-6 overflow-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-3 mb-2"
                >
                    <Crown className={cn(
                        "w-8 h-8",
                        challengeData.isCompleted ? "text-yellow-400" : "text-amber-600"
                    )} />
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                        90-Day Discipline Challenge
                    </h1>
                </motion.div>
                <p className="text-gray-400">
                    Conquering <span className="text-amber-400 font-semibold">{habit.title}</span> through daily discipline
                </p>
            </div>

            {/* Main Progress Display */}
            <div className="max-w-4xl mx-auto">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                            "p-6 rounded-2xl border-2 text-center",
                            challengeData.isCompleted
                                ? "border-yellow-500 bg-yellow-500/10"
                                : "border-amber-700/50 bg-gray-900/50"
                        )}
                    >
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Trophy className={cn(
                                "w-6 h-6",
                                challengeData.isCompleted ? "text-yellow-400" : "text-amber-500"
                            )} />
                            <span className="text-gray-400 text-sm">Challenge Progress</span>
                        </div>
                        <div className="text-4xl font-bold text-white">
                            Day {challengeData.progress}
                            <span className="text-xl text-gray-500">/90</span>
                        </div>
                        {challengeData.isCompleted && (
                            <div className="mt-2 text-yellow-400 font-semibold flex items-center justify-center gap-1">
                                <Sparkles className="w-4 h-4" /> CHALLENGE COMPLETE
                            </div>
                        )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="p-6 rounded-2xl border-2 border-orange-700/50 bg-gray-900/50 text-center"
                    >
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Flame className="w-6 h-6 text-orange-500" />
                            <span className="text-gray-400 text-sm">Current Streak</span>
                        </div>
                        <div className="text-4xl font-bold text-white">
                            {challengeData.currentStreak}
                            <span className="text-xl text-gray-500"> days</span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="p-6 rounded-2xl border-2 border-emerald-700/50 bg-gray-900/50 text-center"
                    >
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Target className="w-6 h-6 text-emerald-500" />
                            <span className="text-gray-400 text-sm">Completion</span>
                        </div>
                        <div className="text-4xl font-bold text-white">
                            {Math.round(challengeData.completionPercentage)}
                            <span className="text-xl text-gray-500">%</span>
                        </div>
                    </motion.div>
                </div>

                {/* Victory Image Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="relative aspect-square max-w-lg mx-auto rounded-3xl overflow-hidden bg-gradient-to-b from-gray-900 to-black border-4 border-amber-900/30 shadow-2xl"
                >
                    {/* Background - Victory Image (using a gradient representation) */}
                    <div className="absolute inset-0">
                        {/* Victory scene - mountain/sun symbolism */}
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-200 via-orange-400 to-red-500" />

                        {/* Mountain silhouette */}
                        <div className="absolute bottom-0 left-0 right-0 h-3/4">
                            <svg viewBox="0 0 400 300" className="w-full h-full" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="mountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#fef3c7" />
                                        <stop offset="50%" stopColor="#f59e0b" />
                                        <stop offset="100%" stopColor="#78350f" />
                                    </linearGradient>
                                </defs>
                                <path d="M0 300 L0 200 L100 100 L150 140 L200 50 L280 160 L320 120 L400 200 L400 300 Z" fill="url(#mountainGrad)" />
                                <path d="M200 50 L250 120 L280 160 L200 200 L150 140 Z" fill="#fef3c7" opacity="0.9" />
                                {/* Sun behind mountain */}
                                <circle cx="200" cy="80" r="40" fill="#fef08a" />
                            </svg>
                        </div>

                        {/* Warrior silhouette at peak */}
                        <motion.div
                            className="absolute bottom-1/3 left-1/2 -translate-x-1/2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: challengeData.completionPercentage > 30 ? 1 : 0 }}
                            transition={{ duration: 1 }}
                        >
                            <svg width="80" height="120" viewBox="0 0 80 120" className="text-amber-900">
                                <path d="M40 0 L50 10 L45 15 L55 20 L50 25 L60 30 L55 35 L65 45 L70 40 L75 50 L70 55 L60 60 L55 70 L60 80 L55 90 L45 90 L40 100 L35 90 L25 90 L20 80 L25 70 L20 60 L10 55 L5 50 L10 40 L15 45 L20 35 L25 30 L30 25 L25 20 L35 15 L30 10 Z" fill="currentColor" />
                                <circle cx="40" cy="30" r="8" fill="currentColor" />
                            </svg>
                        </motion.div>

                        {/* Light rays effect */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-t from-transparent via-yellow-500/20 to-transparent"
                            animate={{ opacity: challengeData.completionPercentage / 100 }}
                            transition={{ duration: 1 }}
                        />
                    </div>

                    {/* Mud Overlay */}
                    <AnimatePresence>
                        {mudOpacity > 0 && (
                            <motion.div
                                className="absolute inset-0"
                                initial={{ opacity: 1 }}
                                animate={{ opacity: mudOpacity }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                {/* Mud texture */}
                                <div className="absolute inset-0 bg-gradient-to-b from-amber-950 via-amber-900 to-stone-900" />

                                {/* Mud splatters and texture */}
                                <div className="absolute inset-0 opacity-60">
                                    <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                                        <defs>
                                            <filter id="mudNoise">
                                                <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" />
                                                <feDisplacementMap in="SourceGraphic" scale="10" />
                                            </filter>
                                        </defs>
                                        <rect width="100" height="100" fill="#3d2914" filter="url(#mudNoise)" />
                                    </svg>
                                </div>

                                {/* Heavy mud drips */}
                                <div className="absolute inset-x-0 top-0 h-1/3">
                                    {[...Array(12)].map((_, i) => (
                                        <motion.div
                                            key={`drip-${i}`}
                                            className="absolute w-4 bg-gradient-to-b from-amber-800 to-amber-950 rounded-full"
                                            style={{
                                                left: `${5 + i * 8}%`,
                                                height: `${20 + Math.random() * 30}%`,
                                            }}
                                            animate={{
                                                height: [
                                                    `${20 + Math.random() * 30}%`,
                                                    `${25 + Math.random() * 35}%`,
                                                    `${20 + Math.random() * 30}%`
                                                ]
                                            }}
                                            transition={{
                                                duration: 2 + Math.random() * 2,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                        />
                                    ))}
                                </div>

                                {/* Mud layer label */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <motion.div
                                            className="text-6xl font-black text-amber-950/80 mb-2"
                                            style={{
                                                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                                                transform: 'rotate(-5deg)'
                                            }}
                                            animate={{ scale: [1, 1.02, 1] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                        >
                                            BURIED
                                        </motion.div>
                                        <div className="text-amber-900/60 text-lg font-semibold">
                                            Keep pushing to uncover your victory
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Crack overlays */}
                    <AnimatePresence>
                        {crackIntensity > 0 && (
                            <motion.div
                                className="absolute inset-0 pointer-events-none"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: crackIntensity }}
                            >
                                <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                                    <defs>
                                        <filter id="glow">
                                            <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
                                            <feMerge>
                                                <feMergeNode in="coloredBlur"/>
                                                <feMergeNode in="SourceGraphic"/>
                                            </feMerge>
                                        </filter>
                                    </defs>
                                    {/* Cracks that grow */}
                                    {crackIntensity > 0.2 && (
                                        <>
                                            <path d="M50 0 L48 20 L52 35 L47 50 L51 65 L48 80 L50 100"
                                                  stroke="#fbbf24" strokeWidth={crackIntensity * 2} fill="none"
                                                  filter="url(#glow)"
                                                  style={{ opacity: crackIntensity }} />
                                            <path d="M30 0 L32 15 L28 30 L33 45 L29 60 L31 80 L28 100"
                                                  stroke="#fbbf24" strokeWidth={crackIntensity * 1.5} fill="none"
                                                  filter="url(#glow)"
                                                  style={{ opacity: crackIntensity * 0.8 }} />
                                            <path d="M70 0 L68 20 L72 35 L69 55 L71 70 L68 100"
                                                  stroke="#fbbf24" strokeWidth={crackIntensity * 1.5} fill="none"
                                                  filter="url(#glow)"
                                                  style={{ opacity: crackIntensity * 0.8 }} />
                                        </>
                                    )}
                                </svg>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Completion overlay */}
                    <AnimatePresence>
                        {challengeData.isCompleted && (
                            <motion.div
                                className="absolute inset-0 flex items-center justify-center bg-black/30"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <motion.div
                                    className="text-center"
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                >
                                    <div className="text-6xl mb-4">🏆</div>
                                    <div className="text-3xl font-black text-yellow-400" style={{ textShadow: '0 0 20px rgba(250,204,21,0.5)' }}>
                                        VICTORY
                                    </div>
                                    <div className="text-amber-200 text-lg font-semibold mt-2">
                                        90 Days of Discipline Complete!
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Progress Bar */}
                <div className="mt-8 max-w-lg mx-auto">
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                        <span>Progress to Freedom</span>
                        <span>{Math.round(challengeData.completionPercentage)}%</span>
                    </div>
                    <div className="h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                        <motion.div
                            className="h-full bg-gradient-to-r from-amber-700 via-orange-500 to-yellow-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${challengeData.completionPercentage}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        />
                    </div>
                </div>

                {/* Motivational Messages */}
                <div className="mt-8 text-center">
                    <AnimatePresence mode="wait">
                        {challengeData.isCompleted ? (
                            <motion.div
                                key="completed"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="text-yellow-400 text-xl font-semibold"
                            >
                                <Sparkles className="inline w-5 h-5 mr-2" />
                                You've conquered the darkness. The light is your inheritance.
                                <Sparkles className="inline w-5 h-5 ml-2" />
                            </motion.div>
                        ) : challengeData.hasRelapsed ? (
                            <motion.div
                                key="relapsed"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="text-red-400 text-lg"
                            >
                                <AlertTriangle className="inline w-5 h-5 mr-2" />
                                The challenge has reset. Every warrior falls before they rise. Start again today.
                            </motion.div>
                        ) : challengeData.progress < 10 ? (
                            <motion.div
                                key="early"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="text-amber-400"
                            >
                                <Sunrise className="inline w-5 h-5 mr-2" />
                                The first steps are the hardest. You've started. Keep going.
                            </motion.div>
                        ) : challengeData.progress < 30 ? (
                            <motion.div
                                key="building"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="text-orange-400"
                            >
                                <Flame className="inline w-5 h-5 mr-2" />
                                The fire is lit. Your discipline is becoming stronger.
                            </motion.div>
                        ) : challengeData.progress < 60 ? (
                            <motion.div
                                key="strong"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="text-yellow-400"
                            >
                                <Mountain className="inline w-5 h-5 mr-2" />
                                You're climbing higher. The view is getting clearer.
                            </motion.div>
                        ) : (
                            <motion.div
                                key="near"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="text-green-400"
                            >
                                <Zap className="inline w-5 h-5 mr-2" />
                                Victory is in sight. Don't stop now warrior.
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Habit Connection Info */}
                <div className="mt-8 p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Link2 className="w-4 h-4" />
                        <span>Connected to habit:</span>
                        <span className="text-amber-400 font-medium">{habit.title}</span>
                        <span className="text-gray-500">• Streak: {habit.streak} days</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
