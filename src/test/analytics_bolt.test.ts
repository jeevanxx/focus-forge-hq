import { describe, it, expect, vi } from 'vitest';
import { getWeeklyFocus } from '../lib/analytics';
import { FocusSession } from '../lib/mock-data';
import { addDays, startOfWeek } from 'date-fns';

describe('getWeeklyFocus Performance', () => {
  it('should handle a large number of sessions efficiently', () => {
    const now = new Date('2024-05-22T12:00:00Z');
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Create 10,000 sessions distributed across the week and some outside
    const sessions: FocusSession[] = Array.from({ length: 10000 }).map((_, i) => {
      const date = addDays(weekStart, (i % 14) - 3); // some before, some during, some after the week
      return {
        id: `s${i}`,
        date: date.toISOString(),
        durationMin: 25,
      };
    });

    const start = performance.now();
    // Run it multiple times to get a better measurement
    const iterations = 10;
    for (let i = 0; i < iterations; i++) {
      getWeeklyFocus(sessions, now);
    }
    const end = performance.now();

    const avgTime = (end - start) / iterations;
    console.log(`Average execution time for 10,000 sessions: ${avgTime.toFixed(2)}ms`);

    const result = getWeeklyFocus(sessions, now);
    expect(result).toHaveLength(7);
    // Verification of correctness:
    // sessions are (i % 14) - 3 days from weekStart.
    // i % 14 takes values 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13
    // (i % 14) - 3 takes values -3, -2, -1, 0, 1, 2, 3, 4, 5, 6
    // Days in week are offsets 0, 1, 2, 3, 4, 5, 6.
    // So days with offsets 0 to 6 should have sessions.
    // 10,000 / 14 is approx 714.28.
    // Each offset should appear floor(10000/14) or ceil(10000/14) times.
    result.forEach((d, i) => {
        expect(d.minutes).toBeGreaterThan(0);
    });
  }, { timeout: 20000 });
});
