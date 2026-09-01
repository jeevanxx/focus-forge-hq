import { describe, test, expect } from "vitest";
import { getWeeklyFocus, getWeeklyFocusTotal } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { startOfWeek, addDays, format } from "date-fns";

describe("Analytics - getWeeklyFocus", () => {
  const now = new Date("2026-08-05T12:00:00Z"); // Wednesday
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday

  test("returns 0 minutes for all 7 days when sessions list is empty", () => {
    const weekly = getWeeklyFocus([], now);
    expect(weekly).toHaveLength(7);
    expect(weekly.every((d) => d.minutes === 0)).toBe(true);
    expect(weekly[0].day).toBe("Mon");
    expect(weekly[6].day).toBe("Sun");
  });

  test("correctly aggregates minutes for sessions within current week", () => {
    const mondayDate = format(addDays(weekStart, 0), "yyyy-MM-dd");
    const wednesdayDate = format(addDays(weekStart, 2), "yyyy-MM-dd");
    const sundayDate = format(addDays(weekStart, 6), "yyyy-MM-dd");

    const sessions: FocusSession[] = [
      { id: "1", date: `${mondayDate}T09:00:00.000Z`, durationMin: 25, completed: true },
      { id: "2", date: `${mondayDate}T14:00:00.000Z`, durationMin: 50, completed: true },
      { id: "3", date: `${wednesdayDate}T10:00:00.000Z`, durationMin: 30, completed: true },
      { id: "4", date: `${sundayDate}T20:00:00.000Z`, durationMin: 45, completed: true },
      // Session outside current week
      { id: "5", date: "2025-01-01T10:00:00.000Z", durationMin: 60, completed: true },
    ];

    const weekly = getWeeklyFocus(sessions, now);
    expect(weekly[0].minutes).toBe(75); // Monday: 25 + 50
    expect(weekly[1].minutes).toBe(0);  // Tuesday
    expect(weekly[2].minutes).toBe(30); // Wednesday
    expect(weekly[6].minutes).toBe(45); // Sunday: 45

    expect(getWeeklyFocusTotal(sessions, now)).toBe(150);
  });

  test("benchmark execution time with 14,000 sessions", () => {
    const sessions: FocusSession[] = [];
    const totalSessions = 14000;
    const moduloBase = 14; // 14 days spread around weekStart

    for (let i = 0; i < totalSessions; i++) {
      const dayOffset = (i % moduloBase) - 3; // spread from Monday - 3 days to + 10 days
      const dateStr = format(addDays(weekStart, dayOffset), "yyyy-MM-dd");
      sessions.push({
        id: `sess-${i}`,
        date: `${dateStr}T10:00:00.000Z`,
        durationMin: 15,
        completed: true,
      });
    }

    // Warm-up run to exclude JIT compilation overhead
    getWeeklyFocus(sessions, now);

    const start = performance.now();
    const runs = 10;
    for (let r = 0; r < runs; r++) {
      getWeeklyFocus(sessions, now);
    }
    const end = performance.now();
    const avgDuration = (end - start) / runs;

    console.log(`[Benchmark] Average execution time for 14,000 sessions: ${avgDuration.toFixed(2)}ms`);

    // Basic sanity check on calculation output
    const weekly = getWeeklyFocus(sessions, now);
    expect(weekly).toHaveLength(7);
    // Each of the 7 days in the current week receives 1000 sessions * 15 min = 15,000 min
    for (let d = 0; d < 7; d++) {
      expect(weekly[d].minutes).toBe(15000);
    }
  }, 20000);
});
