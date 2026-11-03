import { describe, test, expect } from "vitest";
import { getWeeklyFocus } from "@/lib/analytics";
import type { FocusSession } from "@/lib/types";
import { startOfWeek, addDays, format } from "date-fns";

describe("getWeeklyFocus", () => {
  test("correctly calculates weekly focus minutes per day", () => {
    const now = new Date(2025, 0, 15); // Wednesday, Jan 15, 2025
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Mon Jan 13, 2025

    const monDate = format(addDays(weekStart, 0), "yyyy-MM-dd");
    const wedDate = format(addDays(weekStart, 2), "yyyy-MM-dd");

    const sessions: FocusSession[] = [
      { id: "1", date: `${monDate}T10:00:00.000Z`, durationMin: 25 },
      { id: "2", date: `${monDate}T14:00:00.000Z`, durationMin: 50 },
      { id: "3", date: `${wedDate}T09:00:00.000Z`, durationMin: 30 },
      { id: "4", date: "2024-12-01T10:00:00.000Z", durationMin: 60 }, // Outside current week
    ];

    const weekly = getWeeklyFocus(sessions, now);

    expect(weekly).toHaveLength(7);
    expect(weekly[0]).toEqual({ day: "Mon", date: monDate, minutes: 75 });
    expect(weekly[1].minutes).toBe(0);
    expect(weekly[2]).toEqual({ day: "Wed", date: wedDate, minutes: 30 });
    expect(weekly[3].minutes).toBe(0);
    expect(weekly[4].minutes).toBe(0);
    expect(weekly[5].minutes).toBe(0);
    expect(weekly[6].minutes).toBe(0);
  });

  test("benchmarks getWeeklyFocus execution speed over a large dataset (14,000 sessions)", () => {
    const now = new Date(2025, 0, 15); // Wednesday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    const datasetSize = 14000;
    const sessions: FocusSession[] = [];

    // Distribute sessions evenly across 14 days (7 in current week, 7 outside)
    for (let i = 0; i < datasetSize; i++) {
      const dayOffset = (i % 14) - 3; // Offset around week start
      const dateStr = format(addDays(weekStart, dayOffset), "yyyy-MM-dd");
      sessions.push({
        id: `sess-${i}`,
        date: `${dateStr}T10:00:00.000Z`,
        durationMin: 20,
      });
    }

    // Warm up
    getWeeklyFocus(sessions, now);

    const start = performance.now();
    const runs = 10;
    for (let r = 0; r < runs; r++) {
      getWeeklyFocus(sessions, now);
    }
    const duration = performance.now() - start;
    const avgDuration = duration / runs;

    // Verify results are non-empty and calculated correctly
    const weekly = getWeeklyFocus(sessions, now);
    const totalMin = weekly.reduce((sum, d) => sum + d.minutes, 0);
    expect(totalMin).toBeGreaterThan(0);
    expect(avgDuration).toBeLessThan(200); // 200ms threshold
  }, 20000);
});
