import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { format, subDays, startOfWeek, addDays, parseISO } from "date-fns";

describe("getWeeklyFocus Optimization Benchmark & Correctness", () => {
  it("computes identical results as the baseline approach (correctness verification)", () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate test sessions across several weeks
    const sessions: FocusSession[] = [];
    for (let i = 0; i < 50; i++) {
      // Some dates in target week, some outside
      const date = subDays(now, i % 14);
      sessions.push({
        id: `session-${i}`,
        date: date.toISOString(),
        durationMin: 20 + (i % 3) * 10,
      });
    }

    // Baseline implementation
    const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
    const baselineGetWeeklyFocus = (
      sessionsList: FocusSession[],
      referenceDate: Date = new Date()
    ) => {
      const start = startOfWeek(referenceDate, { weekStartsOn: 1 });
      return WEEK_LABELS.map((day, i) => {
        const date = addDays(start, i);
        const dateKey = format(date, "yyyy-MM-dd");
        const minutes = sessionsList
          .filter((s) => format(parseISO(s.date), "yyyy-MM-dd") === dateKey)
          .reduce((sum, s) => sum + s.durationMin, 0);
        return { day, date: dateKey, minutes };
      });
    };

    const baselineResult = baselineGetWeeklyFocus(sessions, now);
    const optimizedResult = getWeeklyFocus(sessions, now);

    expect(optimizedResult).toEqual(baselineResult);
  });

  it("benchmarks performance and demonstrates speedup on a moderately sized dataset", { timeout: 30000 }, () => {
    const now = new Date();

    // 4,200 sessions (multiple of 14) evenly distributed across a 14-day window.
    // Moderately sized to ensure rapid execution within Vitest limits.
    const sessions: FocusSession[] = [];
    for (let i = 0; i < 4200; i++) {
      const date = subDays(now, i % 14);
      sessions.push({
        id: `session-${i}`,
        date: date.toISOString(),
        durationMin: 25,
      });
    }

    // Baseline O(7N) implementation
    const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
    const baselineGetWeeklyFocus = (
      sessionsList: FocusSession[],
      referenceDate: Date = new Date()
    ) => {
      const start = startOfWeek(referenceDate, { weekStartsOn: 1 });
      return WEEK_LABELS.map((day, i) => {
        const date = addDays(start, i);
        const dateKey = format(date, "yyyy-MM-dd");
        const minutes = sessionsList
          .filter((s) => format(parseISO(s.date), "yyyy-MM-dd") === dateKey)
          .reduce((sum, s) => sum + s.durationMin, 0);
        return { day, date: dateKey, minutes };
      });
    };

    // Warm up the JIT compiler to ensure compilation overhead is not measured
    baselineGetWeeklyFocus(sessions, now);
    getWeeklyFocus(sessions, now);

    // Measure baseline run times
    const startBaseline = performance.now();
    for (let r = 0; r < 20; r++) {
      baselineGetWeeklyFocus(sessions, now);
    }
    const endBaseline = performance.now();
    const baselineTotalTime = endBaseline - startBaseline;

    // Measure optimized run times
    const startOptimized = performance.now();
    for (let r = 0; r < 20; r++) {
      getWeeklyFocus(sessions, now);
    }
    const endOptimized = performance.now();
    const optimizedTotalTime = endOptimized - startOptimized;

    const speedup = baselineTotalTime / optimizedTotalTime;

    console.log(`[getWeeklyFocus Performance Results]`);
    console.log(`- Dataset size: ${sessions.length} focus sessions`);
    console.log(`- Runs: 20`);
    console.log(`- Baseline implementation execution time: ${baselineTotalTime.toFixed(2)} ms`);
    console.log(`- Optimized single-pass O(N) execution time: ${optimizedTotalTime.toFixed(2)} ms`);
    console.log(`- Calculated Speedup: ~${speedup.toFixed(2)}x`);

    // Verify optimized implementation is strictly faster than baseline
    expect(optimizedTotalTime).toBeLessThan(baselineTotalTime);
  });
});
