import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "@/lib/analytics";
import { addDays, startOfWeek, format, parseISO } from "date-fns";
import type { FocusSession } from "@/lib/mock-data";

// Simulated original O(7N) nested implementation with repeated parseISO calls for comparison
const originalGetWeeklyFocus = (
  sessions: FocusSession[],
  now: Date = new Date()
) => {
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

describe("getWeeklyFocus performance benchmark & correctness", () => {
  it("should match original implementation correctness exactly", () => {
    const now = new Date();
    const mockSessions: FocusSession[] = Array.from({ length: 50 }).map((_, i) => {
      const date = addDays(now, (i % 7) - 3);
      date.setHours(9, 0, 0, 0);
      return {
        id: `s-${i}`,
        date: date.toISOString(),
        durationMin: 25,
      };
    });

    const originalResult = originalGetWeeklyFocus(mockSessions, now);
    const optimizedResult = getWeeklyFocus(mockSessions, now);

    expect(optimizedResult).toEqual(originalResult);
  });

  it(
    "should execute O(N) single-pass getWeeklyFocus significantly faster than O(7N) nested filtering on large datasets",
    { timeout: 20000 },
    () => {
      const now = new Date();
      // Generate 10,000 sessions distributed across the year, with many inside the current week
      const sessions: FocusSession[] = Array.from({ length: 10000 }).map((_, i) => {
        const dayOffset = (i % 30) - 15; // distributed in a month window
        const date = addDays(now, dayOffset);
        date.setHours(i % 24, 0, 0, 0);
        return {
          id: `s-${i}`,
          date: date.toISOString(),
          durationMin: 25,
        };
      });

      // Warm up both algorithms
      originalGetWeeklyFocus(sessions, now);
      getWeeklyFocus(sessions, now);

      // Measure original O(7N) algorithm
      const startOriginal = performance.now();
      const originalResult = originalGetWeeklyFocus(sessions, now);
      const endOriginal = performance.now();
      const durationOriginal = endOriginal - startOriginal;

      // Measure optimized O(N) algorithm
      const startOptimized = performance.now();
      const optimizedResult = getWeeklyFocus(sessions, now);
      const endOptimized = performance.now();
      const durationOptimized = endOptimized - startOptimized;

      console.log(
        `[Benchmark] Original O(7N) getWeeklyFocus took ${durationOriginal.toFixed(2)}ms for 10,000 sessions`
      );
      console.log(
        `[Benchmark] Optimized O(N) getWeeklyFocus took ${durationOptimized.toFixed(2)}ms for 10,000 sessions`
      );

      const speedup = durationOriginal / durationOptimized;
      console.log(`[Benchmark] Overall Speedup: ${speedup.toFixed(2)}x`);

      expect(optimizedResult).toEqual(originalResult);
      // Ensure the optimized run is indeed faster
      expect(durationOptimized).toBeLessThan(durationOriginal);
    }
  );
});
