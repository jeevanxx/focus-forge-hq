import { describe, test, expect } from "vitest";
import { getWeeklyFocus } from "@/lib/analytics";
import type { FocusSession } from "@/lib/types";
import { format, addDays, startOfWeek } from "date-fns";

describe("getWeeklyFocus", () => {
  const now = new Date(2025, 4, 15); // Fixed reference date: Thursday May 15 2025
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday May 12 2025

  test("returns 7 days with 0 minutes when sessions list is empty", () => {
    const res = getWeeklyFocus([], now);
    expect(res.length).toBe(7);
    expect(res.map((r) => r.day)).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    expect(res.every((r) => r.minutes === 0)).toBe(true);
  });

  test("correctly aggregates minutes for sessions within the week", () => {
    const mondayISO = format(addDays(weekStart, 0), "yyyy-MM-dd'T'10:00:00.000'Z'");
    const wednesdayISO = format(addDays(weekStart, 2), "yyyy-MM-dd'T'14:00:00.000'Z'");

    const sessions: FocusSession[] = [
      { id: "1", durationMin: 25, date: mondayISO },
      { id: "2", durationMin: 50, date: mondayISO },
      { id: "3", durationMin: 30, date: wednesdayISO },
    ];

    const res = getWeeklyFocus(sessions, now);
    expect(res[0].minutes).toBe(75); // Mon
    expect(res[1].minutes).toBe(0);  // Tue
    expect(res[2].minutes).toBe(30); // Wed
  });

  test("ignores sessions outside the current week", () => {
    const lastWeekISO = format(addDays(weekStart, -3), "yyyy-MM-dd'T'10:00:00.000'Z'");
    const nextWeekISO = format(addDays(weekStart, 10), "yyyy-MM-dd'T'10:00:00.000'Z'");

    const sessions: FocusSession[] = [
      { id: "1", durationMin: 60, date: lastWeekISO },
      { id: "2", durationMin: 60, date: nextWeekISO },
    ];

    const res = getWeeklyFocus(sessions, now);
    expect(res.every((r) => r.minutes === 0)).toBe(true);
  });

  test("benchmarks performance over large session dataset", () => {
    // Generate 14,000 sessions distributed across 14 days (7 within current week, 7 outside)
    // 14,000 is a multiple of 14 for even distribution
    const sessions: FocusSession[] = [];
    for (let i = 0; i < 14000; i++) {
      const dayOffset = (i % 14) - 3; // offsets -3 to +10 days from Monday
      const d = addDays(weekStart, dayOffset);
      sessions.push({
        id: `session-${i}`,
        durationMin: 25,
        date: format(d, "yyyy-MM-dd'T'10:00:00.000'Z'"),
      });
    }

    // Warm-up call to avoid JIT overhead in benchmark
    getWeeklyFocus(sessions, now);

    const start = performance.now();
    const result = getWeeklyFocus(sessions, now);
    const duration = performance.now() - start;

    expect(result.length).toBe(7);
    // Each of the 7 days in the week gets 1,000 sessions * 25 mins = 25,000 mins
    expect(result[0].minutes).toBe(25000);
    expect(duration).toBeLessThan(200); // Should execute comfortably under 200ms
  }, 20000);
});
