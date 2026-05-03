import { describe, it, expect } from 'vitest';
import { isPerfectDay, isPerfectWeek, getWeekEndDate } from '../lib/perfectDetection';

// Helper to build a mock habit with completedDates
const mockHabit = (dates: string[]) => ({
  _id: 'h1',
  title: 'Test Habit',
  completedDates: dates.map(d => new Date(d)),
  streak: 0,
  category: 'work' as const,
  description: '',
  createdAt: new Date(),
});

describe('isPerfectDay', () => {
  it('returns true when all habits are completed on that date', () => {
    const habits = [
      mockHabit(['2026-05-01', '2026-05-02']),
      mockHabit(['2026-05-01']),
    ];
    // May 1 = Friday 2026
    expect(isPerfectDay(new Date('2026-05-01'), habits)).toBe(true);
  });

  it('returns false when some habits are missing', () => {
    const habits = [
      mockHabit(['2026-05-01']),
      mockHabit([]), // second habit not done
    ];
    expect(isPerfectDay(new Date('2026-05-01'), habits)).toBe(false);
  });

  it('returns false when no habits exist', () => {
    expect(isPerfectDay(new Date('2026-05-01'), [])).toBe(false);
  });
});

describe('getWeekEndDate', () => {
  it('returns Saturday of the week for any input date', () => {
    // May 1 2026 is a Friday; the Sat ending that week is May 2
    expect(getWeekEndDate(new Date('2026-05-01')).toDateString())
      .toBe(new Date(2026, 4, 2).toDateString()); // Sat May 2
    // May 4 2026 is a Monday; the Sat ending that week is May 9
    expect(getWeekEndDate(new Date('2026-05-04')).toDateString())
      .toBe(new Date(2026, 4, 9).toDateString()); // Sat May 9
  });
});

describe('isPerfectWeek', () => {
  it('returns true when all 7 Sun-Sat days have all habits completed', () => {
    // All 7 days of the week containing May 1 2026 (Apr 26 - May 2 2026)
    const habits = [
      mockHabit(['2026-04-26','2026-04-27','2026-04-28','2026-04-29','2026-04-30','2026-05-01','2026-05-02']),
      mockHabit(['2026-04-26','2026-04-27','2026-04-28','2026-04-29','2026-04-30','2026-05-01','2026-05-02']),
    ];
    // Pass the Saturday of that week (May 2, 2026)
    expect(isPerfectWeek(new Date('2026-05-02'), habits)).toBe(true);
  });

  it('returns false when one day is missing completions', () => {
    const habits = [
      mockHabit(['2026-04-26','2026-04-27','2026-04-28','2026-04-29','2026-04-30',          '2026-05-02']),
      mockHabit(['2026-04-26','2026-04-27','2026-04-28','2026-04-29','2026-04-30','2026-05-01','2026-05-02']),
    ];
    expect(isPerfectWeek(new Date('2026-05-02'), habits)).toBe(false);
  });

  it('returns false when habits array is empty', () => {
    expect(isPerfectWeek(new Date('2026-05-02'), [])).toBe(false);
  });
});
