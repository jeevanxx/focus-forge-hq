import { describe, test, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { format, addDays, startOfWeek } from "date-fns";

describe("getWeeklyFocus performance & correctness", () => {
  const now = new Date(2025, 1, 20, 12, 0, 0); // Thu Feb 20 2025
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Mon Feb 17 2025

  // Generate 14,000 test focus sessions spread across dates
  const sessions: FocusSession[] = Array.from({ length: 14000 }, (_, i) => {
    const dayOffset = i % 14; // Spread across 14 days (this week and previous/next)
    const sessionDate = addDays(weekStart, dayOffset);
    return {
      id: `session-${i}`,
      date: sessionDate.toISOString(),
      durationMin: 30,
    };
  });

  test("returns correct daily focus minutes", () => {
    const result = getWeeklyFocus(sessions, now);
    expect(result).toHaveLength(7);
    // For 14,000 sessions over 14 days, each day in the week (7 days) has 1,000 sessions of 30 mins = 30,000 mins
    result.forEach((day) => {
      expect(day.minutes).toBe(30000);
    });
  });

  test("executes rapidly on large datasets", () => {
    // Warmup JIT
    getWeeklyFocus(sessions, now);

    const start = performance.now();
    const iterations = 10;
    for (let i = 0; i < iterations; i++) {
      getWeeklyFocus(sessions, now);
    }
    const duration = performance.now() - start;
    const avgMs = duration / iterations;

    console.log(`Average getWeeklyFocus time for 14,000 sessions: ${avgMs.toFixed(2)}ms`);
    // Threshold check to ensure fast execution
    expect(avgMs).toBeLessThan(200);
  });
});
