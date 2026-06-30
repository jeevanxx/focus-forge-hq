import { describe, it, expect } from 'vitest';
import { getWeeklyFocus, getWeeklyFocusTotal } from '../lib/analytics';
import { FocusSession } from '../lib/mock-data';
import { startOfWeek, addDays, format } from 'date-fns';

describe('Analytics Weekly Focus', () => {
  const now = new Date('2024-05-22T12:00:00Z'); // A Wednesday
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday 2024-05-20

  it('should correctly bucket sessions into days', () => {
    const sessions: FocusSession[] = [
      { id: '1', date: addDays(weekStart, 0).toISOString(), durationMin: 30 }, // Monday
      { id: '2', date: addDays(weekStart, 0).toISOString(), durationMin: 20 }, // Monday
      { id: '3', date: addDays(weekStart, 2).toISOString(), durationMin: 60 }, // Wednesday
      { id: '4', date: addDays(weekStart, 6).toISOString(), durationMin: 45 }, // Sunday
    ];

    const result = getWeeklyFocus(sessions, now);

    expect(result[0].minutes).toBe(50); // Mon
    expect(result[1].minutes).toBe(0);  // Tue
    expect(result[2].minutes).toBe(60); // Wed
    expect(result[6].minutes).toBe(45); // Sun
    expect(result).toHaveLength(7);
  });

  it('should exclude sessions outside the current week', () => {
    const sessions: FocusSession[] = [
      { id: 'prev', date: addDays(weekStart, -1).toISOString(), durationMin: 100 },
      { id: 'next', date: addDays(weekStart, 7).toISOString(), durationMin: 100 },
      { id: 'current', date: addDays(weekStart, 1).toISOString(), durationMin: 50 },
    ];

    const result = getWeeklyFocus(sessions, now);
    const total = getWeeklyFocusTotal(sessions, now);

    expect(result[1].minutes).toBe(50);
    expect(total).toBe(50);
    expect(result.reduce((s, d) => s + d.minutes, 0)).toBe(50);
  });

  it('should handle boundary conditions (start and end of week)', () => {
    const mondayStart = new Date(weekStart);
    mondayStart.setHours(0, 0, 0, 0);

    const sundayEnd = addDays(weekStart, 6);
    sundayEnd.setHours(23, 59, 59, 999);

    const sessions: FocusSession[] = [
      { id: 'start', date: mondayStart.toISOString(), durationMin: 10 },
      { id: 'end', date: sundayEnd.toISOString(), durationMin: 20 },
    ];

    const result = getWeeklyFocus(sessions, now);
    expect(result[0].minutes).toBe(10);
    expect(result[6].minutes).toBe(20);
    expect(getWeeklyFocusTotal(sessions, now)).toBe(30);
  });
});
