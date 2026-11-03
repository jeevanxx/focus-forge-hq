import { describe, test, expect } from "vitest";
import { getWeeklyFocus, DailyFocus } from "@/lib/analytics";
import type { FocusSession } from "@/lib/types";
import { format, addDays, startOfWeek } from "date-fns";

describe("getWeeklyFocus correctness & performance", () => {
  const fixedNow = new Date("2025-03-10T12:00:00Z"); // A Monday
  const weekStart = startOfWeek(fixedNow, { weekStartsOn: 1 });

  test("calculates weekly focus accurately for current week sessions", () => {
    const mondayStr = format(weekStart, "yyyy-MM-dd'T'10:00:00'Z'");
    const wednesdayStr = format(addDays(weekStart, 2), "yyyy-MM-dd'T'14:00:00'Z'");

    const sessions: FocusSession[] = [
      { id: "1", userId: "u1", durationMin: 45, date: mondayStr, createdAt: mondayStr },
      { id: "2", userId: "u1", durationMin: 30, date: mondayStr, createdAt: mondayStr },
      { id: "3", userId: "u1", durationMin: 60, date: wednesdayStr, createdAt: wednesdayStr },
      // Session outside this week
      { id: "4", userId: "u1", durationMin: 90, date: "2025-01-01T10:00:00Z", createdAt: "2025-01-01T10:00:00Z" },
    ];

    const weekly = getWeeklyFocus(sessions, fixedNow);

    expect(weekly).toHaveLength(7);
    expect(weekly[0]).toEqual({
      day: "Mon",
      date: format(weekStart, "yyyy-MM-dd"),
      minutes: 75,
    });
    expect(weekly[1]).toEqual({
      day: "Tue",
      date: format(addDays(weekStart, 1), "yyyy-MM-dd"),
      minutes: 0,
    });
    expect(weekly[2]).toEqual({
      day: "Wed",
      date: format(addDays(weekStart, 2), "yyyy-MM-dd"),
      minutes: 60,
    });
  });

  test("handles empty session list without error", () => {
    const weekly = getWeeklyFocus([], fixedNow);
    expect(weekly).toHaveLength(7);
    const totalMin = weekly.reduce((sum, d) => sum + d.minutes, 0);
    expect(totalMin).toBe(0);
  });

  test("performance benchmark: processes large dataset efficiently", () => {
    // Generate 14,000 sessions (multiple of 14 for even distribution across days)
    const totalSessions = 14000;
    const largeSessions: FocusSession[] = [];

    for (let i = 0; i < totalSessions; i++) {
      const dayOffset = i % 14; // Spread across 2 weeks
      const sessionDate = addDays(weekStart, dayOffset);
      const isoStr = format(sessionDate, "yyyy-MM-dd'T'10:00:00'Z'");
      largeSessions.push({
        id: `s-${i}`,
        userId: "user-1",
        durationMin: 25,
        date: isoStr,
        createdAt: isoStr,
      });
    }

    // Warm-up call for JIT
    getWeeklyFocus(largeSessions, fixedNow);

    const start = performance.now();
    const result = getWeeklyFocus(largeSessions, fixedNow);
    const elapsed = performance.now() - start;

    expect(result).toHaveLength(7);
    // Each day of current week (dayOffset 0..6) should have 1000 sessions * 25min = 25000min
    expect(result[0].minutes).toBe(25000);
    // Ensure execution time stays well under threshold (e.g. 200ms) for 14,000 sessions
    expect(elapsed).toBeLessThan(200);
  }, 20000);
});
