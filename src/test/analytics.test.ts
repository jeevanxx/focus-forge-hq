import { describe, it, expect } from 'vitest';
import { getWeeklyFocus } from '../lib/analytics';
import { startOfWeek, addDays, format } from 'date-fns';
import type { FocusSession } from '../lib/mock-data';

describe('getWeeklyFocus', () => {
  const now = new Date('2024-03-20'); // A Wednesday
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday, March 18

  it('correctly buckets sessions into the current week', () => {
    const sessions: FocusSession[] = [
      { id: 's1', date: '2024-03-18T09:00:00Z', durationMin: 30 }, // Monday
      { id: 's2', date: '2024-03-18T14:00:00Z', durationMin: 45 }, // Monday
      { id: 's3', date: '2024-03-20T10:00:00Z', durationMin: 60 }, // Wednesday
      { id: 's4', date: '2024-03-24T20:00:00Z', durationMin: 25 }, // Sunday
    ];

    const result = getWeeklyFocus(sessions, now);

    expect(result).toHaveLength(7);
    expect(result[0].minutes).toBe(75); // Mon
    expect(result[1].minutes).toBe(0);  // Tue
    expect(result[2].minutes).toBe(60); // Wed
    expect(result[6].minutes).toBe(25); // Sun

    expect(result[0].date).toBe('2024-03-18');
    expect(result[6].date).toBe('2024-03-24');
  });

  it('ignores sessions outside the current week', () => {
    const sessions: FocusSession[] = [
      { id: 's0', date: '2024-03-17T23:59:59Z', durationMin: 100 }, // Sunday before
      { id: 's5', date: '2024-03-25T00:00:00Z', durationMin: 100 }, // Monday after
    ];

    const result = getWeeklyFocus(sessions, now);
    const totalMinutes = result.reduce((sum, day) => sum + day.minutes, 0);
    expect(totalMinutes).toBe(0);
  });

  it('handles empty sessions array', () => {
    const result = getWeeklyFocus([], now);
    expect(result).toHaveLength(7);
    result.forEach(day => expect(day.minutes).toBe(0));
  });

  it('works with boundary dates (start of week)', () => {
    const mondayStart = '2024-03-18T00:00:00Z';
    const sessions: FocusSession[] = [
      { id: 's1', date: mondayStart, durationMin: 50 }
    ];
    const result = getWeeklyFocus(sessions, now);
    expect(result[0].minutes).toBe(50);
  });

  it('works with boundary dates (end of week)', () => {
    const sundayEnd = '2024-03-24T23:59:59Z';
    const sessions: FocusSession[] = [
      { id: 's1', date: sundayEnd, durationMin: 50 }
    ];
    const result = getWeeklyFocus(sessions, now);
    expect(result[6].minutes).toBe(50);
  });
});
