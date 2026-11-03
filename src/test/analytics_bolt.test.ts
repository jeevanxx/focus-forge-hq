import { describe, test, expect } from "vitest";
import { startOfWeek, addDays, format } from "date-fns";
import { getWeeklyFocus } from "@/lib/analytics";
import type { FocusSession } from "@/lib/types";

describe("getWeeklyFocus performance & correctness", () => {
  const now = new Date("2025-05-14T12:00:00Z"); // Wednesday
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });

  // Generate 14,000 focus sessions spread across 14 days (7 days in target week, 7 outside)
  const sessions: FocusSession[] = [];
  const totalCount = 14000;
  for (let i = 0; i < totalCount; i++) {
    const dayOffset = i % 14; // Exactly 1,000 sessions per offset day
    const sessionDate = addDays(weekStart, dayOffset);
    sessions.push({
      id: `session-${i}`,
      date: sessionDate.toISOString(),
      durationMin: 25,
      taskTitle: `Task ${i}`,
    });
  }

  test("calculates weekly focus correctly and measures execution speed", () => {
    // Warm-up call
    getWeeklyFocus(sessions, now);

    const start = performance.now();
    const result = getWeeklyFocus(sessions, now);
    const elapsed = performance.now() - start;

    console.log(`[getWeeklyFocus benchmark] Execution time for ${totalCount} sessions: ${elapsed.toFixed(2)}ms`);

    expect(result).toHaveLength(7);
    // Each of the 7 days in the target week should have exactly 1,000 sessions of 25 min = 25,000 min
    for (const dayData of result) {
      expect(dayData.minutes).toBe(25000);
    }
  }, 20000);
});
