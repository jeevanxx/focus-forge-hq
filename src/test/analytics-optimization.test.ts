
import { describe, it, expect } from 'vitest';
import { getWeeklyFocus, getWeeklyFocusTotal } from '../lib/analytics';
import { FocusSession } from '../lib/mock-data';
import { startOfWeek, format, addDays } from 'date-fns';

describe('Analytics Optimization Correctness', () => {
  const now = new Date('2024-05-22T12:00:00Z'); // A Wednesday
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday 2024-05-20

  const sessions: FocusSession[] = [
    { id: '1', taskId: 't1', date: '2024-05-19T23:59:59Z', durationMin: 30 }, // Sunday (Last week)
    { id: '2', taskId: 't1', date: '2024-05-20T08:00:00Z', durationMin: 45 }, // Monday
    { id: '3', taskId: 't1', date: '2024-05-22T10:00:00Z', durationMin: 60 }, // Wednesday
    { id: '4', taskId: 't1', date: '2024-05-26T20:00:00Z', durationMin: 15 }, // Sunday
    { id: '5', taskId: 't1', date: '2024-05-27T00:00:00Z', durationMin: 90 }, // Next Monday
  ];

  it('getWeeklyFocus returns correct minutes per day', () => {
    const result = getWeeklyFocus(sessions, now);

    expect(result).toHaveLength(7);
    expect(result.find(d => d.day === 'Mon')?.minutes).toBe(45);
    expect(result.find(d => d.day === 'Tue')?.minutes).toBe(0);
    expect(result.find(d => d.day === 'Wed')?.minutes).toBe(60);
    expect(result.find(d => d.day === 'Sun')?.minutes).toBe(15);

    const total = result.reduce((sum, d) => sum + d.minutes, 0);
    expect(total).toBe(45 + 60 + 15);
  });

  it('getWeeklyFocusTotal returns correct total minutes', () => {
    const total = getWeeklyFocusTotal(sessions, now);
    expect(total).toBe(45 + 60 + 15);
  });
});
