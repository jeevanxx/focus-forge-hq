import { describe, it, expect } from "vitest";
import { getWeeklyFocus, DailyFocus } from "../lib/analytics";
import { FocusSession } from "../lib/mock-data";
import { format, addDays, startOfWeek } from "date-fns";

// Original implementation for regression checking
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
      .filter((s) => format(new Date(s.date), "yyyy-MM-dd") === dateKey)
      .reduce((sum, s) => sum + s.durationMin, 0);
    return { day, date: dateKey, minutes };
  });
};

describe("getWeeklyFocus Optimization Benchmark and Correctness", () => {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });

  const sampleSessions: FocusSession[] = Array.from({ length: 1000 }).map((_, i) => {
    const day = addDays(weekStart, i % 7);
    day.setHours(9, 0, 0, 0);
    return {
      id: `s${i}`,
      date: day.toISOString(),
      durationMin: 25,
      taskTitle: "Sample Task",
    };
  });

  it("should match original implementation results perfectly", () => {
    const originalRes = originalGetWeeklyFocus(sampleSessions, now);
    const optimizedRes = getWeeklyFocus(sampleSessions, now);

    expect(optimizedRes).toEqual(originalRes);
  });

  it("should execute O(N) optimization significantly faster than original logic", () => {
    const largeSessions: FocusSession[] = Array.from({ length: 10000 }).map((_, i) => {
      const day = addDays(weekStart, i % 7);
      day.setHours(9, 0, 0, 0);
      return {
        id: `s${i}`,
        date: day.toISOString(),
        durationMin: 25,
        taskTitle: "Sample Task",
      };
    });

    const t0 = performance.now();
    const originalRes = originalGetWeeklyFocus(largeSessions, now);
    const t1 = performance.now();
    const originalTime = t1 - t0;

    const t2 = performance.now();
    const optimizedRes = getWeeklyFocus(largeSessions, now);
    const t3 = performance.now();
    const optimizedTime = t3 - t2;

    console.log(`[Benchmark] Original getWeeklyFocus: ${originalTime.toFixed(2)}ms`);
    console.log(`[Benchmark] Optimized getWeeklyFocus: ${optimizedTime.toFixed(2)}ms`);
    console.log(`[Benchmark] Speedup factor: ${(originalTime / optimizedTime).toFixed(2)}x`);

    expect(optimizedRes).toEqual(originalRes);
    expect(optimizedTime).toBeLessThan(originalTime);
  });
});
