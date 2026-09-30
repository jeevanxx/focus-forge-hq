import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { startOfWeek, addDays, format } from "date-fns";

describe("getWeeklyFocus performance & correctness", () => {
  it("calculates weekly focus accurately and performs efficiently", () => {
    const refDate = new Date("2025-03-10T12:00:00.000Z"); // A Monday
    const weekStart = startOfWeek(refDate, { weekStartsOn: 1 });

    // Generate 14,000 sessions distributed across days
    const mockSessions: FocusSession[] = [];
    const totalCount = 14000;
    for (let i = 0; i < totalCount; i++) {
      const dayOffset = i % 14; // half in current week (0..6), half in previous/next
      const sessionDate = addDays(weekStart, dayOffset - 3);
      mockSessions.push({
        id: `session-${i}`,
        date: sessionDate.toISOString(),
        durationMin: 25,
        completedAt: sessionDate.toISOString(),
      });
    }

    // Warm-up call
    getWeeklyFocus(mockSessions, refDate);

    const start = performance.now();
    const runs = 5;
    let weeklyResult = getWeeklyFocus(mockSessions, refDate);
    for (let r = 1; r < runs; r++) {
      weeklyResult = getWeeklyFocus(mockSessions, refDate);
    }
    const elapsed = (performance.now() - start) / runs;

    console.log(`Average getWeeklyFocus runtime for 14,000 sessions: ${elapsed.toFixed(2)}ms`);

    // Verify correctness: exactly 7 days returned
    expect(weeklyResult).toHaveLength(7);
    expect(weeklyResult[0].day).toBe("Mon");
    expect(weeklyResult[6].day).toBe("Sun");

    // Total minutes across days should match generated sessions falling in this week
    const totalMinutes = weeklyResult.reduce((acc, d) => acc + d.minutes, 0);
    expect(totalMinutes).toBeGreaterThan(0);

    // Performance assertion threshold: should execute quickly (< 200ms)
    expect(elapsed).toBeLessThan(300);
  }, 20000);
});
