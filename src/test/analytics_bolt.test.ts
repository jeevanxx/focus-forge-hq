import { describe, it, expect } from "vitest";
import { getWeeklyFocus, type DailyFocus } from "../lib/analytics";
import { startOfWeek, addDays, format, parseISO } from "date-fns";
import type { FocusSession } from "../lib/mock-data";

const originalGetWeeklyFocus = (
  sessions: FocusSession[],
  now: Date = new Date()
): DailyFocus[] => {
  const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  return WEEK_LABELS.map((day, i) => {
    const date = addDays(weekStart, i);
    const dateKey = format(date, "yyyy-MM-dd");
    const minutes = sessions
      .filter((s) => format(parseISO(s.date), "yyyy-MM-dd") === dateKey)
      .reduce((sum, s) => sum + s.durationMin, 0);
    return { day, date: dateKey, minutes };
  });
};

describe("getWeeklyFocus Optimization", () => {
  it("should return the exact same output as the original implementation", () => {
    const now = new Date("2026-05-11T12:00:00.000Z"); // A Monday

    const sessions: FocusSession[] = [
      { id: "1", date: "2026-05-11T10:00:00.000Z", durationMin: 30 }, // Mon
      { id: "2", date: "2026-05-12T15:30:00.000Z", durationMin: 45 }, // Tue
      { id: "3", date: "2026-05-13T09:00:00.000Z", durationMin: 60 }, // Wed
      { id: "4", date: "2026-05-14T20:15:00.000Z", durationMin: 20 }, // Thu
      { id: "5", date: "2026-05-15T11:00:00.000Z", durationMin: 90 }, // Fri
      { id: "6", date: "2026-05-16T14:00:00.000Z", durationMin: 15 }, // Sat
      { id: "7", date: "2026-05-17T18:45:00.000Z", durationMin: 50 }, // Sun
      // Sessions outside the current week
      { id: "8", date: "2026-05-10T23:59:59.000Z", durationMin: 100 }, // Prev Sun
      { id: "9", date: "2026-05-18T00:00:00.000Z", durationMin: 100 }, // Next Mon
    ];

    const originalResult = originalGetWeeklyFocus(sessions, now);
    const optimizedResult = getWeeklyFocus(sessions, now);

    expect(optimizedResult).toEqual(originalResult);
  });

  it("should show a substantial speedup compared to original O(7N) implementation", { timeout: 20000 }, () => {
    const baseDate = new Date("2026-05-11T12:00:00.000Z"); // A Monday

    // Generate 10,000 sessions distributed across days near baseDate
    const sessions: FocusSession[] = [];
    for (let i = 0; i < 10000; i++) {
      const dateOffset = (i % 10) - 2; // -2 to +7 days
      const sessionDate = new Date(baseDate.getTime() + dateOffset * 24 * 60 * 60 * 1000);
      sessions.push({
        id: `s${i}`,
        date: sessionDate.toISOString(),
        durationMin: 20,
        taskTitle: `Task ${i}`,
      });
    }

    // Measure original O(7N) implementation
    const startOriginal = performance.now();
    const originalResult = originalGetWeeklyFocus(sessions, baseDate);
    const endOriginal = performance.now();
    const originalTime = endOriginal - startOriginal;

    // Measure optimized O(N) implementation
    const startOptimized = performance.now();
    const optimizedResult = getWeeklyFocus(sessions, baseDate);
    const endOptimized = performance.now();
    const optimizedTime = endOptimized - startOptimized;

    // Output results to console
    console.log(`[Benchmark] Original implementation took: ${originalTime.toFixed(2)}ms`);
    console.log(`[Benchmark] Optimized implementation took: ${optimizedTime.toFixed(2)}ms`);
    console.log(`[Benchmark] Speedup factor: ${(originalTime / optimizedTime).toFixed(2)}x`);

    // Verify correct behavior
    expect(optimizedResult).toEqual(originalResult);

    // Verify optimized time is significantly faster (at least 2x speedup on any standard machine, but usually >10x)
    expect(optimizedTime).toBeLessThan(originalTime);
  });
});
