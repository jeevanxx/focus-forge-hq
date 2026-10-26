import { describe, test, expect } from "vitest";
import { getWeeklyFocus, getWeeklyFocusTotal } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { startOfWeek, addDays, format } from "date-fns";

describe("getWeeklyFocus Optimization & Correctness", () => {
  const now = new Date(2025, 0, 15); // Wednesday, Jan 15, 2025
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday, Jan 13, 2025

  test("correctly calculates weekly focus minutes per day", () => {
    const mondayStr = format(weekStart, "yyyy-MM-dd'T'10:00:00.000'Z'");
    const wednesdayStr = format(addDays(weekStart, 2), "yyyy-MM-dd'T'14:30:00.000'Z'");
    const sundayStr = format(addDays(weekStart, 6), "yyyy-MM-dd'T'18:00:00.000'Z'");
    const nextWeekStr = format(addDays(weekStart, 8), "yyyy-MM-dd'T'09:00:00.000'Z'");

    const sessions: FocusSession[] = [
      { id: "1", userId: "u1", taskId: "t1", durationMin: 25, date: mondayStr, created_at: mondayStr },
      { id: "2", userId: "u1", taskId: "t2", durationMin: 50, date: mondayStr, created_at: mondayStr },
      { id: "3", userId: "u1", taskId: "t3", durationMin: 45, date: wednesdayStr, created_at: wednesdayStr },
      { id: "4", userId: "u1", taskId: "t4", durationMin: 30, date: sundayStr, created_at: sundayStr },
      // Session outside current week
      { id: "5", userId: "u1", taskId: "t5", durationMin: 60, date: nextWeekStr, created_at: nextWeekStr },
    ];

    const weeklyFocus = getWeeklyFocus(sessions, now);

    expect(weeklyFocus).toHaveLength(7);
    expect(weeklyFocus[0]).toEqual({
      day: "Mon",
      date: format(weekStart, "yyyy-MM-dd"),
      minutes: 75,
    });
    expect(weeklyFocus[2]).toEqual({
      day: "Wed",
      date: format(addDays(weekStart, 2), "yyyy-MM-dd"),
      minutes: 45,
    });
    expect(weeklyFocus[6]).toEqual({
      day: "Sun",
      date: format(addDays(weekStart, 6), "yyyy-MM-dd"),
      minutes: 30,
    });
    expect(getWeeklyFocusTotal(sessions, now)).toBe(150);
  });

  test("handles empty sessions array cleanly", () => {
    const weeklyFocus = getWeeklyFocus([], now);
    expect(weeklyFocus).toHaveLength(7);
    expect(weeklyFocus.every((d) => d.minutes === 0)).toBe(true);
    expect(getWeeklyFocusTotal([], now)).toBe(0);
  });

  test("benchmark: executes single-pass iteration significantly faster than 200ms for 14,000 sessions", () => {
    const totalSessions = 14000;
    const largeSessions: FocusSession[] = [];

    // Generate 14,000 sessions evenly distributed across 14 calendar days
    for (let i = 0; i < totalSessions; i++) {
      const dayOffset = i % 14;
      const sessionDate = addDays(weekStart, dayOffset);
      const isoDate = format(sessionDate, "yyyy-MM-dd'T'12:00:00.000'Z'");
      largeSessions.push({
        id: `s-${i}`,
        userId: "u1",
        taskId: `t-${i}`,
        durationMin: 25,
        date: isoDate,
        created_at: isoDate,
      });
    }

    // Warm-up call for JIT
    getWeeklyFocus(largeSessions, now);

    const start = performance.now();
    const result = getWeeklyFocus(largeSessions, now);
    const duration = performance.now() - start;

    expect(result).toHaveLength(7);
    // 7 days in week, each day has 1,000 sessions of 25 min = 25,000 mins
    expect(result[0].minutes).toBe(25000);
    expect(duration).toBeLessThan(200); // Expect fast single-pass performance well under 200ms
  }, 20000);
});
