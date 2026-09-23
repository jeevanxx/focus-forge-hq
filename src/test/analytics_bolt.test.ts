import { describe, test, expect } from "vitest";
import { addDays, format, startOfWeek } from "date-fns";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";

describe("getWeeklyFocus performance & correctness", () => {
  test("returns correct weekly focus minutes and handles large dataset efficiently", () => {
    const refDate = new Date(2025, 1, 19, 12, 0, 0); // Wednesday Feb 19 2025
    const weekStart = startOfWeek(refDate, { weekStartsOn: 1 }); // Monday Feb 17 2025

    // Generate 14,000 focus sessions across 14 days centered around refDate (1,000 per day)
    // 14,000 is a multiple of 14, ensuring uniform distribution across days.
    const numSessions = 14000;
    const sessions: FocusSession[] = [];

    for (let i = 0; i < numSessions; i++) {
      const dayOffset = (i % 14) - 3; // -3 to +10 days from Monday
      const sessionDate = addDays(weekStart, dayOffset);
      sessions.push({
        id: `session-${i}`,
        date: sessionDate.toISOString(),
        durationMin: 30,
        completedAt: sessionDate.toISOString(),
      });
    }

    // Warm-up call
    getWeeklyFocus(sessions, refDate);

    // Measure execution time
    const start = performance.now();
    const result = getWeeklyFocus(sessions, refDate);
    const duration = performance.now() - start;

    console.log(`[getWeeklyFocus] 14,000 sessions processed in ${duration.toFixed(2)}ms`);

    // Verify correctness:
    // Days 0 to 6 in the current week (Mon..Sun) should each have 1,000 sessions * 30 min = 30,000 min
    expect(result).toHaveLength(7);
    for (const dayData of result) {
      expect(dayData.minutes).toBe(30000);
    }
  }, 20000);
});
