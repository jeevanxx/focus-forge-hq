import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { addDays, startOfWeek, format } from "date-fns";

describe("analytics_bolt regression and benchmark", () => {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });

  const originalGetWeeklyFocus = (
    sessions: FocusSession[],
    now: Date = new Date()
  ) => {
    const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
    const weekStartLocal = startOfWeek(now, { weekStartsOn: 1 });
    return WEEK_LABELS.map((day, i) => {
      const date = addDays(weekStartLocal, i);
      const dateKey = format(date, "yyyy-MM-dd");
      const minutes = sessions
        .filter((s) => format(new Date(s.date), "yyyy-MM-dd") === dateKey)
        .reduce((sum, s) => sum + s.durationMin, 0);
      return { day, date: dateKey, minutes };
    });
  };

  it("correctly calculates weekly focus exactly like original implementation", () => {
    const testSessions: FocusSession[] = [
      {
        id: "1",
        userId: "u1",
        durationMin: 30,
        date: addDays(weekStart, 0).toISOString(),
        taskTitle: "Mon Task",
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        userId: "u1",
        durationMin: 45,
        date: addDays(weekStart, 0).toISOString(),
        taskTitle: "Mon Task 2",
        createdAt: new Date().toISOString(),
      },
      {
        id: "3",
        userId: "u1",
        durationMin: 60,
        date: addDays(weekStart, 2).toISOString(),
        taskTitle: "Wed Task",
        createdAt: new Date().toISOString(),
      },
      {
        id: "4",
        userId: "u1",
        durationMin: 25,
        date: addDays(weekStart, 6).toISOString(),
        taskTitle: "Sun Task",
        createdAt: new Date().toISOString(),
      },
    ];

    const resultOriginal = originalGetWeeklyFocus(testSessions, now);
    const resultOptimized = getWeeklyFocus(testSessions, now);

    expect(resultOptimized).toEqual(resultOriginal);
  });

  it("demonstrates O(N) performance improvement vs O(7N) original implementation under high load", { timeout: 20000 }, () => {
    // Generate a larger dataset of focus sessions (e.g. 5,000 sessions)
    const largeSessions: FocusSession[] = [];
    for (let i = 0; i < 5000; i++) {
      const dayOffset = i % 7;
      largeSessions.push({
        id: String(i),
        userId: "u1",
        durationMin: 15,
        date: addDays(weekStart, dayOffset).toISOString(),
        createdAt: new Date().toISOString(),
      });
    }

    // Warm up the functions to JIT compile the hot paths
    originalGetWeeklyFocus(largeSessions, now);
    getWeeklyFocus(largeSessions, now);

    // Measure Original
    const startOriginal = performance.now();
    for (let i = 0; i < 20; i++) {
      originalGetWeeklyFocus(largeSessions, now);
    }
    const endOriginal = performance.now();
    const durationOriginal = endOriginal - startOriginal;

    // Measure Optimized
    const startOptimized = performance.now();
    for (let i = 0; i < 20; i++) {
      getWeeklyFocus(largeSessions, now);
    }
    const endOptimized = performance.now();
    const durationOptimized = endOptimized - startOptimized;

    console.log(`Original getWeeklyFocus execution time (20 runs of 5,000 items): ${durationOriginal.toFixed(2)}ms`);
    console.log(`Optimized getWeeklyFocus execution time (20 runs of 5,000 items): ${durationOptimized.toFixed(2)}ms`);

    // The optimized function should be significantly faster (typically > 3x faster)
    expect(durationOptimized).toBeLessThan(durationOriginal);
  });
});
