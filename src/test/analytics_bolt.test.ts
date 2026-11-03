import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { format, addDays, startOfWeek } from "date-fns";

describe("getWeeklyFocus performance & correctness", () => {
  const referenceDate = new Date("2026-03-30T10:00:00Z"); // Monday
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });

  it("correctly calculates weekly focus minutes per day", () => {
    const mondayStr = format(weekStart, "yyyy-MM-dd");
    const wednesdayStr = format(addDays(weekStart, 2), "yyyy-MM-dd");
    const sundayStr = format(addDays(weekStart, 6), "yyyy-MM-dd");

    const sessions: FocusSession[] = [
      { id: "1", date: `${mondayStr}T09:00:00Z`, durationMin: 25 },
      { id: "2", date: `${mondayStr}T14:00:00Z`, durationMin: 50 },
      { id: "3", date: `${wednesdayStr}T10:00:00Z`, durationMin: 30 },
      { id: "4", date: `${sundayStr}T18:00:00Z`, durationMin: 45 },
      // Session outside this week
      { id: "5", date: "2026-01-01T10:00:00Z", durationMin: 60 },
    ];

    const result = getWeeklyFocus(sessions, referenceDate);

    expect(result).toHaveLength(7);
    expect(result[0]).toEqual({ day: "Mon", date: mondayStr, minutes: 75 });
    expect(result[1].minutes).toBe(0);
    expect(result[2]).toEqual({ day: "Wed", date: wednesdayStr, minutes: 30 });
    expect(result[6]).toEqual({ day: "Sun", date: sundayStr, minutes: 45 });
  });

  it("handles empty sessions list", () => {
    const result = getWeeklyFocus([], referenceDate);
    expect(result).toHaveLength(7);
    result.forEach((day) => {
      expect(day.minutes).toBe(0);
    });
  });

  it("benchmarks single-pass getWeeklyFocus with large session count", { timeout: 20000 }, () => {
    // Generate 14,000 sessions distributed evenly across 14 days (7 in current week, 7 prior week)
    const sessions: FocusSession[] = [];
    for (let i = 0; i < 14000; i++) {
      const dayOffset = i % 14; // 0..13
      const sessionDate = format(addDays(weekStart, dayOffset), "yyyy-MM-dd");
      sessions.push({
        id: `sess-${i}`,
        date: `${sessionDate}T10:00:00Z`,
        durationMin: 10,
      });
    }

    // Warm-up call
    getWeeklyFocus(sessions, referenceDate);

    const start = performance.now();
    const runs = 20;
    for (let r = 0; r < runs; r++) {
      getWeeklyFocus(sessions, referenceDate);
    }
    const end = performance.now();
    const totalDuration = end - start;
    const avgDuration = totalDuration / runs;

    // Verify aggregate totals for the current week days (index 0..6)
    const result = getWeeklyFocus(sessions, referenceDate);
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      expect(result[dayIdx].minutes).toBe(10000);
    }

    // Performance assertion: generous threshold (200ms) to prevent fragile test failures on CI environment
    expect(avgDuration).toBeLessThan(200);
  });
});
