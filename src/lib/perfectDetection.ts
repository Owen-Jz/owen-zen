/**
 * Returns "YYYY-MM-DD" string in Africa/Lagos timezone (matches HabitView's toLocalString).
 */
const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Africa/Lagos',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

const dayFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Africa/Lagos',
  weekday: 'short'
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
 * Given a date, returns the Saturday ending that date's week (Sunday-Saturday).
 * Uses Africa/Lagos timezone to determine day of week.
 */
export const getWeekEndDate = (date: Date): Date => {
  const d = new Date(date.getTime());
  const dayName = dayFormatter.format(d);
  const dayIdx = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(dayName);
  const daysUntilSat = dayIdx === 6 ? 0 : 7 - dayIdx;
  d.setDate(d.getDate() + daysUntilSat);
  return d;
};

/**
 * Returns true if every habit in the array has a completedDate entry for the given date.
 * An empty habits array returns false.
 */
export const isPerfectDay = (date: Date, habits: { completedDates: (Date | string)[] }[]): boolean => {
  if (habits.length === 0) return false;
  const target = toLocalString(date);
  return habits.every(h =>
    h.completedDates.some(cd => toLocalString(cd) === target)
  );
};

/**
 * Returns true if every day of the Sun-Sat week ending on saturdayDate has every habit completed.
 * An empty habits array returns false.
 */
export const isPerfectWeek = (saturdayDate: Date, habits: { completedDates: (Date | string)[] }[]): boolean => {
  if (habits.length === 0) return false;
  const sat = getWeekEndDate(saturdayDate);
  for (let i = 0; i < 7; i++) {
    const day = new Date(sat);
    day.setDate(sat.getDate() - (6 - i)); // Sunday through Saturday
    if (!isPerfectDay(day, habits)) return false;
  }
  return true;
};
