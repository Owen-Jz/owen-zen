export const getCurrentWeekKey = (): string => {
    const now = new Date();
    const t = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil((((t.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${t.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
};

export const getWeekDates = (weekKey: string): { start: Date; end: Date } => {
    const [yearStr, weekStr] = weekKey.split('-W');
    const year = parseInt(yearStr);
    const week = parseInt(weekStr);

    const jan4 = new Date(Date.UTC(year, 0, 4));
    const day = jan4.getUTCDay() || 7;
    const weekStart = new Date(Date.UTC(year, 0, 4 - day + (week - 1) * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return { start: weekStart, end: weekEnd };
};

export const getWeekDays = (weekKey: string): Date[] => {
    const { start } = getWeekDates(weekKey);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
    });
};

export const toLocalString = (d: Date | string): string => {
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Lagos',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const parts = formatter.formatToParts(dateObj);
    const yr = parts.find(p => p.type === 'year')?.value;
    const mo = parts.find(p => p.type === 'month')?.value;
    const da = parts.find(p => p.type === 'day')?.value;
    return `${yr}-${mo}-${da}`;
};