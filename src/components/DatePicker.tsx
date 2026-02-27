import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface DatePickerProps {
    value: string | undefined; // ISO string format usually YYYY-MM-DD
    onChange: (date: string) => void;
    placeholder?: string;
    className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, placeholder = "Select date", className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState<Date>(
        value ? new Date(value) : new Date()
    );
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (value && !isNaN(new Date(value).getTime())) {
            setCurrentMonth(new Date(value));
        }
    }, [value, isOpen]);

    const toggleOpen = () => setIsOpen(!isOpen);

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const renderHeader = () => {
        return (
            <div className="flex justify-between items-center mb-4">
                <button
                    type="button"
                    onClick={prevMonth}
                    className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                    <ChevronLeft size={16} />
                </button>
                <div className="font-bold text-sm text-gray-200">
                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </div>
                <button
                    type="button"
                    onClick={nextMonth}
                    className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        );
    };

    const renderDays = () => {
        const days = [];
        const dateFormat = "short";
        const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

        // Day names
        ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach((day, i) => {
            days.push(
                <div key={`day-name-${i}`} className="text-center text-[10px] font-bold text-gray-500 uppercase">
                    {day}
                </div>
            );
        });

        return <div className="grid grid-cols-7 gap-1 mb-2">{days}</div>;
    };

    const renderCells = () => {
        const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        const startDate = new Date(monthStart);
        startDate.setDate(startDate.getDate() - startDate.getDay()); // go back to Sunday

        const endDate = new Date(monthEnd);
        if (endDate.getDay() !== 6) {
            endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // go forward to Saturday
        }

        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = "";

        const isSameDay = (d1: Date, d2: Date) => {
            return d1.getFullYear() === d2.getFullYear() &&
                d1.getMonth() === d2.getMonth() &&
                d1.getDate() === d2.getDate();
        };

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = day.getDate().toString();
                const cloneDay = new Date(day);
                const isSelected = value ? isSameDay(day, new Date(value)) : false;
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const isToday = isSameDay(day, new Date());

                days.push(
                    <button
                        type="button"
                        key={day.toISOString()}
                        onClick={() => {
                            // YYYY-MM-DD local format without timezone shift
                            const yyyy = cloneDay.getFullYear();
                            const mm = String(cloneDay.getMonth() + 1).padStart(2, '0');
                            const dd = String(cloneDay.getDate()).padStart(2, '0');
                            onChange(`${yyyy}-${mm}-${dd}`);
                            setIsOpen(false);
                        }}
                        className={cn(
                            "p-1.5 flex justify-center items-center rounded-xl text-xs font-medium transition-all w-8 h-8",
                            !isCurrentMonth ? "text-gray-600 hover:text-gray-400" : "text-gray-300",
                            isCurrentMonth && !isSelected && "hover:bg-white/10 hover:text-white",
                            isSelected && "bg-primary text-white font-bold shadow-[0_0_10px_rgba(var(--primary),0.5)]",
                            isToday && !isSelected && "border border-primary/50 text-primary"
                        )}
                    >
                        {formattedDate}
                    </button>
                );
                day.setDate(day.getDate() + 1);
            }
            rows.push(
                <div className="grid grid-cols-7 gap-1" key={day.toISOString()}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div className="space-y-1">{rows}</div>;
    };

    const formattedDisplayValue = value && !isNaN(new Date(value).getTime())
        ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : placeholder;

    return (
        <div className="relative w-full" ref={containerRef}>
            <button
                type="button"
                onClick={toggleOpen}
                className={cn(
                    "w-full flex items-center justify-between bg-black/20 border border-white/10 rounded-lg pl-3 pr-4 py-2.5 text-sm transition-colors hover:bg-black/30 outline-none",
                    value ? "text-gray-200" : "text-gray-500 focus:border-primary",
                    isOpen && "border-primary shadow-[0_0_10px_rgba(var(--primary),0.2)]"
                )}
            >
                <div className="flex items-center gap-2">
                    <CalendarIcon size={14} className={value ? "text-primary" : "text-gray-500"} />
                    <span>{formattedDisplayValue}</span>
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 mt-2 p-4 bg-surface/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-[280px]"
                    >
                        {renderHeader()}
                        {renderDays()}
                        {renderCells()}

                        <div className="mt-4 pt-3 border-t border-white/10 flex justify-between">
                            <button
                                type="button"
                                onClick={() => { onChange(''); setIsOpen(false); }}
                                className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                            >
                                Clear
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const today = new Date();
                                    const yyyy = today.getFullYear();
                                    const mm = String(today.getMonth() + 1).padStart(2, '0');
                                    const dd = String(today.getDate()).padStart(2, '0');
                                    onChange(`${yyyy}-${mm}-${dd}`);
                                    setIsOpen(false);
                                }}
                                className="text-xs text-primary hover:text-primary-light transition-colors font-bold"
                            >
                                Today
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
