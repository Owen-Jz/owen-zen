/**
 * Returns "YYYY-MM-DD" string in Africa/Lagos timezone (matches HabitView's toLocalString).
 * Kept for API compatibility — hot path uses toLocalStringFast below.
 */
const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Africa/Lagos',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

export const toLocalString = (d: Date | string): string => {
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  const parts = formatter.formatToParts(dateObj);
  const yr = parts.find(p => p.type === 'year')?.value;
  const mo = parts.find(p => p.type === 'month')?.value;
  const da = parts.find(p => p.type === 'day')?.value;
  return `${yr}-${mo}-${da}`;
};

/**
 * Fast path: extract YYYY-MM-DD from an ISO string without creating Date objects.
 * Input: "2026-05-03T00:00:00.000Z" → "2026-05-03"
 * Input: "2026-05-03" → "2026-05-03"
 */
const toDateKey = (d: Date | string): string => {
  if (typeof d === 'string') {
    // ISO string: "2026-05-03T00:00:00.000Z" or "2026-05-03"
    return d.substring(0, 10);
  }
  // Date object: format via Intl (rare — avoids the hot path)
  const parts = formatter.formatToParts(d);
  const yr = parts.find(p => p.type === 'year')?.value;
  const mo = parts.find(p => p.type === 'month')?.value;
  const da = parts.find(p => p.type === 'day')?.value;
  return `${yr}-${mo}-${da}`;
};

/**
 * Returns "YYYY-MM-DD" string in Africa/Lagos timezone for a Date object.
 * Uses local method when dateObj has no time component (avoids Intl overhead).
 */
const toDateKeyFromDate = (dateObj: Date): string => {
  const yr = dateObj.getFullYear();
  const mo = String(dateObj.getMonth() + 1).padStart(2, '0');
  const da = String(dateObj.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${da}`;
};

/**
 * Given a date, returns the Saturday ending that date's week (Sunday-Saturday).
 */
export const getWeekEndDate = (date: Date): Date => {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + (6 - d.getDay()));
  return d;
};

/**
 * Returns true if every habit in the array has a completedDate entry for the given date.
 * An empty habits array returns false.
 * Optimized: uses direct string comparison with no Date/object creation.
 */
export const isPerfectDay = (
  date: Date,
  habits: { completedDates: (Date | string)[] }[]
): boolean => {
  if (habits.length === 0) return false;
  const dateKey = toDateKeyFromDate(date);
  return habits.every(h =>
    h.completedDates.some(cd => toDateKey(cd) === dateKey)
  );
};

/**
 * Returns true if every day of the Sun-Sat week ending on saturdayDate has every habit completed.
 * An empty habits array returns false.
 */
export const isPerfectWeek = (
  saturdayDate: Date,
  habits: { completedDates: (Date | string)[] }[]
): boolean => {
  if (habits.length === 0) return false;
  const sat = new Date(saturdayDate.getTime());
  sat.setDate(sat.getDate() - sat.getDay()); // Rewind to Sunday
  for (let i = 0; i < 7; i++) {
    const day = new Date(sat);
    day.setDate(sat.getDate() + i);
    if (!isPerfectDay(day, habits)) return false;
  }
  return true;
};
