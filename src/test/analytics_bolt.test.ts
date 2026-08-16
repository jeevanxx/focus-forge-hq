import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "@/lib/analytics";
import type { FocusSession } from "@/lib/types";
import { addDays, format, startOfWeek } from "date-fns";

describe("getWeeklyFocus performance & correctness", () => {
  it("calculates weekly focus accurately and measures execution time", { timeout: 20000 }, () => {
    const now = new Date(2025, 0, 15); // Fixed reference date
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 14,000 sessions distributed across 14 days (7 in current week, 7 in adjacent week)
    const sessions: FocusSession[] = [];
    const totalSessions = 14000; // Perfect multiple of 14

    for (let i = 0; i < totalSessions; i++) {
      const dayOffset = i % 14; // Evenly distributed
      const dateObj = addDays(weekStart, dayOffset);
      const isoDate = format(dateObj, "yyyy-MM-dd'T'HH:mm:ss");

      sessions.push({
        id: `session-${i}`,
        date: isoDate,
        durationMin: 25,
        taskId: `task-${i % 100}`,
      });
    }

    // Warm-up call
    getWeeklyFocus(sessions, now);

    const start = performance.now();
    const result = getWeeklyFocus(sessions, now);
    const elapsed = performance.now() - start;

    console.log(`getWeeklyFocus execution time for 14,000 sessions: ${elapsed.toFixed(2)}ms`);

    expect(result).toHaveLength(7);

    // Each day in the current week should have 1,000 sessions * 25 minutes = 25,000 minutes
    for (const day of result) {
      expect(day.minutes).toBe(25000);
    }
  });
});
