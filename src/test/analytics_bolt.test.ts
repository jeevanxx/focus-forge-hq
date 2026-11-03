import { describe, test, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import { addDays, startOfWeek, format } from "date-fns";
import type { FocusSession } from "../lib/types";

describe("getWeeklyFocus performance & correctness", () => {
  test("correctly calculates weekly focus minutes and handles large datasets efficiently", () => {
    const now = new Date("2025-01-08T12:00:00Z"); // Wednesday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday Jan 6, 2025

    // Generate 14,000 sessions evenly distributed across 14 days (modulo 14 base)
    const sessions: FocusSession[] = [];
    const totalSessions = 14000;
    for (let i = 0; i < totalSessions; i++) {
      const sessionDate = addDays(weekStart, i % 14);
      sessions.push({
        id: `session-${i}`,
        date: sessionDate.toISOString(),
        durationMin: 25,
        completedAt: sessionDate.toISOString(),
      });
    }

    // Warm-up call to avoid measuring JIT compilation overhead
    getWeeklyFocus(sessions.slice(0, 100), now);

    const start = performance.now();
    const result = getWeeklyFocus(sessions, now);
    const end = performance.now();

    const durationMs = end - start;
    console.log(`getWeeklyFocus for ${totalSessions} sessions took: ${durationMs.toFixed(2)} ms`);

    // Verify correctness:
    // First 7 days (index 0..6) are in the current week.
    // Each day in the current week receives totalSessions / 14 sessions = 1000 sessions of 25 min = 25000 min.
    expect(result).toHaveLength(7);
    for (const dayFocus of result) {
      expect(dayFocus.minutes).toBe(1000 * 25);
    }

    // Ensure execution time is reasonable
    expect(durationMs).toBeLessThan(1000);
  }, 20000);
});
