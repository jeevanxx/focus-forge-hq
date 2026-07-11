import { describe, it, expect } from 'vitest';
import { getWeeklyFocus, getWeeklyFocusTotal } from '../lib/analytics';
import { FocusSession } from '../lib/mock-data';

describe('Analytics Correctness', () => {
  const now = new Date('2025-05-22T12:00:00Z'); // Thursday
  // Mon: 19, Tue: 20, Wed: 21, Thu: 22, Fri: 23, Sat: 24, Sun: 25

  it('correctly aggregates sessions within the current week', () => {
    const sessions: FocusSession[] = [
      { id: '1', date: '2025-05-19T10:00:00Z', durationMin: 30 }, // Mon
      { id: '2', date: '2025-05-21T15:00:00Z', durationMin: 45 }, // Wed
      { id: '3', date: '2025-05-21T16:00:00Z', durationMin: 15 }, // Wed
      { id: '4', date: '2025-05-25T09:00:00Z', durationMin: 60 }, // Sun
    ];

    const weekly = getWeeklyFocus(sessions, now);
    expect(weekly).toHaveLength(7);
    expect(weekly[0].minutes).toBe(30); // Mon
    expect(weekly[1].minutes).toBe(0);  // Tue
    expect(weekly[2].minutes).toBe(60); // Wed
    expect(weekly[3].minutes).toBe(0);  // Thu
    expect(weekly[4].minutes).toBe(0);  // Fri
    expect(weekly[5].minutes).toBe(0);  // Sat
    expect(weekly[6].minutes).toBe(60); // Sun

    const total = getWeeklyFocusTotal(sessions, now);
    expect(total).toBe(150);
  });

  it('ignores sessions outside the current week', () => {
    const sessions: FocusSession[] = [
      { id: '1', date: '2025-05-18T23:59:59Z', durationMin: 30 }, // Prev Sun
      { id: '2', date: '2025-05-26T00:00:00Z', durationMin: 45 }, // Next Mon
      { id: '3', date: '2025-05-22T10:00:00Z', durationMin: 20 }, // This Thu
    ];

    const weekly = getWeeklyFocus(sessions, now);
    expect(weekly[3].minutes).toBe(20);
    const total = getWeeklyFocusTotal(sessions, now);
    expect(total).toBe(20);
  });

  it('handles empty sessions', () => {
    const weekly = getWeeklyFocus([], now);
    expect(weekly.every(d => d.minutes === 0)).toBe(true);
    expect(getWeeklyFocusTotal([], now)).toBe(0);
  });
});
