
import { describe, it, expect, vi } from 'vitest';
import { getWeeklyFocus } from '../lib/analytics';
import { FocusSession } from '../lib/mock-data';
import { addDays, startOfWeek, format } from 'date-fns';

describe('getWeeklyFocus Benchmark', () => {
  it('measures performance of getWeeklyFocus with many sessions', () => {
    const now = new Date('2023-10-25'); // A Wednesday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Create 10,000 sessions distributed over the week
    const sessions: FocusSession[] = [];
    for (let i = 0; i < 10000; i++) {
      const dayOffset = i % 7;
      const date = addDays(weekStart, dayOffset);
      sessions.push({
        id: `s-${i}`,
        date: date.toISOString(),
        durationMin: 25,
        taskTitle: 'Task'
      });
    }

    const start = performance.now();
    for (let i = 0; i < 10; i++) {
      getWeeklyFocus(sessions, now);
    }
    const end = performance.now();

    console.log(`Execution time for 10 iterations of 10,000 sessions: ${end - start}ms`);
  });

  it('correctly calculates weekly focus', () => {
    const now = new Date('2023-10-25');
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const sessions: FocusSession[] = [
      { id: '1', date: weekStart.toISOString(), durationMin: 30, taskTitle: 'T1' },
      { id: '2', date: addDays(weekStart, 1).toISOString(), durationMin: 45, taskTitle: 'T2' },
      { id: '3', date: addDays(weekStart, 1).toISOString(), durationMin: 15, taskTitle: 'T3' },
    ];

    const result = getWeeklyFocus(sessions, now);
    expect(result[0].minutes).toBe(30); // Mon
    expect(result[1].minutes).toBe(60); // Tue
    expect(result[2].minutes).toBe(0);  // Wed
  });
});
