import { describe, test, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { addDays, startOfWeek, format } from "date-fns";

describe("getWeeklyFocus performance & correctness", () => {
  test("calculates weekly focus correctly and efficiently", () => {
    const now = new Date("2025-01-15T12:00:00Z"); // Wednesday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 14,000 focus sessions distributed across 14 days (7 in-week, 7 out-of-week)
    // 14,000 is a perfect multiple of 14 (1000 sessions per day)
    const sessions: FocusSession[] = [];
    const totalCount = 14000;

    for (let i = 0; i < totalCount; i++) {
      const dayOffset = (i % 14) - 3; // spread around current week start
      const dateObj = addDays(weekStart, dayOffset);
      sessions.push({
        id: `session-${i}`,
        date: dateObj.toISOString(),
        durationMin: 30,
      });
    }

    // Warm-up call
    getWeeklyFocus(sessions, now);

    const start = performance.now();
    const result = getWeeklyFocus(sessions, now);
    const duration = performance.now() - start;

    console.log(`getWeeklyFocus execution time for 14,000 sessions: ${duration.toFixed(2)}ms`);

    // Verify result length and structure
    expect(result).toHaveLength(7);
    expect(result[0].day).toBe("Mon");
    expect(result[6].day).toBe("Sun");

    // Each in-week day (offset 0..6) should have exactly 1000 sessions * 30 min = 30,000 min
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const expectedDate = format(addDays(weekStart, dayIdx), "yyyy-MM-dd");
      expect(result[dayIdx].date).toBe(expectedDate);
      expect(result[dayIdx].minutes).toBe(30000);
    }
  }, 20000);
});
