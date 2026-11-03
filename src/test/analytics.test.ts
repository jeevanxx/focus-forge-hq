import { describe, it, expect } from "vitest";
import { getWeeklyFocus, getWeeklyFocusTotal } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { startOfWeek, addDays, format } from "date-fns";

describe("getWeeklyFocus Optimization & Correctness", () => {
  const referenceDate = new Date("2025-02-17T10:00:00Z"); // Monday, Feb 17, 2025
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });

  const monDate = format(addDays(weekStart, 0), "yyyy-MM-dd");
  const wedDate = format(addDays(weekStart, 2), "yyyy-MM-dd");
  const sunDate = format(addDays(weekStart, 6), "yyyy-MM-dd");

  it("correctly aggregates focus minutes for current week sessions", () => {
    const mockSessions: FocusSession[] = [
      { id: "1", date: `${monDate}T09:00:00Z`, durationMin: 25 },
      { id: "2", date: `${monDate}T14:00:00Z`, durationMin: 50 },
      { id: "3", date: `${wedDate}T11:00:00Z`, durationMin: 30 },
      { id: "4", date: `${sunDate}T18:00:00Z`, durationMin: 45 },
      // Session outside this week
      { id: "5", date: "2025-01-01T10:00:00Z", durationMin: 60 },
    ];

    const result = getWeeklyFocus(mockSessions, referenceDate);

    expect(result).toHaveLength(7);
    expect(result[0]).toEqual({ day: "Mon", date: monDate, minutes: 75 });
    expect(result[2]).toEqual({ day: "Wed", date: wedDate, minutes: 30 });
    expect(result[6]).toEqual({ day: "Sun", date: sunDate, minutes: 45 });
    expect(getWeeklyFocusTotal(mockSessions, referenceDate)).toBe(150);
  });

  it("handles empty sessions array without errors", () => {
    const result = getWeeklyFocus([], referenceDate);
    expect(result).toHaveLength(7);
    result.forEach((dayObj) => expect(dayObj.minutes).toBe(0));
    expect(getWeeklyFocusTotal([], referenceDate)).toBe(0);
  });

  it("executes single-pass O(N) aggregation efficiently for large datasets", { timeout: 20000 }, () => {
    // Generate a 14,000 session dataset distributed across 14 days (multiple of 14 for even balance)
    const datasetSize = 14000;
    const largeSessions: FocusSession[] = [];

    for (let i = 0; i < datasetSize; i++) {
      const dayOffset = i % 14; // Spread across 14 days
      const sessionDate = format(addDays(weekStart, dayOffset), "yyyy-MM-dd");
      largeSessions.push({
        id: `sess-${i}`,
        date: `${sessionDate}T10:00:00Z`,
        durationMin: 10,
      });
    }

    // Warm-up call to eliminate JIT compilation overhead
    getWeeklyFocus(largeSessions, referenceDate);

    const start = performance.now();
    const runs = 20;
    for (let r = 0; r < runs; r++) {
      getWeeklyFocus(largeSessions, referenceDate);
    }
    const duration = performance.now() - start;
    const avgDuration = duration / runs;

    // Verify average execution time is well under threshold (e.g. < 200ms)
    expect(avgDuration).toBeLessThan(200);

    // Verify correctness on large dataset:
    // First 7 days each have 1000 sessions * 10 min = 10,000 min
    const weeklyResult = getWeeklyFocus(largeSessions, referenceDate);
    weeklyResult.forEach((dayObj) => {
      expect(dayObj.minutes).toBe(10000);
    });
  });
});
