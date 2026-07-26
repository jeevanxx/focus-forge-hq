import { describe, test, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import { startOfWeek, addDays } from "date-fns";
import type { FocusSession } from "../lib/mock-data";

describe("getWeeklyFocus O(N) performance and regression tests", () => {
  test("correctly calculates weekly focus minutes", () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    const sessions: FocusSession[] = [
      {
        id: "s1",
        date: addDays(weekStart, 0).toISOString(), // Mon
        durationMin: 25,
      },
      {
        id: "s2",
        date: addDays(weekStart, 0).toISOString(), // Mon
        durationMin: 35,
      },
      {
        id: "s3",
        date: addDays(weekStart, 2).toISOString(), // Wed
        durationMin: 50,
      },
      {
        id: "s4",
        date: addDays(weekStart, 6).toISOString(), // Sun
        durationMin: 90,
      },
      {
        id: "s5",
        date: addDays(weekStart, -1).toISOString(), // Out of bounds (prev Sunday)
        durationMin: 120,
      },
      {
        id: "s6",
        date: addDays(weekStart, 7).toISOString(), // Out of bounds (next Monday)
        durationMin: 45,
      },
    ];

    const result = getWeeklyFocus(sessions, now);

    expect(result).toHaveLength(7);
    expect(result[0].minutes).toBe(60); // Mon (25 + 35)
    expect(result[1].minutes).toBe(0);  // Tue
    expect(result[2].minutes).toBe(50); // Wed
    expect(result[3].minutes).toBe(0);  // Thu
    expect(result[4].minutes).toBe(0);  // Fri
    expect(result[5].minutes).toBe(0);  // Sat
    expect(result[6].minutes).toBe(90); // Sun
  });

  test("runs efficiently with a large dataset (10,000 sessions)", { timeout: 20000 }, () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 10,000 sessions distributed across days
    const sessions: FocusSession[] = [];
    for (let i = 0; i < 10000; i++) {
      const dayOffset = i % 10; // some inside 0-6 range, some outside
      sessions.push({
        id: `s-${i}`,
        date: addDays(weekStart, dayOffset - 2).toISOString(),
        durationMin: 10,
      });
    }

    const start = performance.now();
    const result = getWeeklyFocus(sessions, now);
    const end = performance.now();
    const duration = end - start;

    console.log(`[Benchmark] getWeeklyFocus with 10,000 sessions took: ${duration.toFixed(2)}ms`);

    // Basic validity checks
    expect(result).toHaveLength(7);
    // Since we created 10,000 sessions, they should be successfully processed
    // Day index offset map: i % 10 - 2
    // Inside range [0..6] implies: i % 10 is in [2..8]
    // 7 days correspond to offset indices 0, 1, 2, 3, 4, 5, 6 (offset -2 is 0, so i % 10 is 2)
    // Each of the 7 valid days gets 1000 sessions (for i % 10 values: 2, 3, 4, 5, 6, 7, 8)
    // Thus, each should have exactly 1000 * 10 = 10000 minutes.
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      expect(result[dayIdx].minutes).toBe(10000);
    }

    // Expect the optimized version to run well within acceptable benchmark limits (typically under 10ms for O(N))
    expect(duration).toBeLessThan(100); // Highly generous threshold for CI/CD environments
  });
});
