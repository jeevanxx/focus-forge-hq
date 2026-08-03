import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/mock-data";
import { addDays, startOfWeek, format } from "date-fns";

describe("getWeeklyFocus Benchmark & Regression Test", () => {
  it("profiles getWeeklyFocus performance and checks correctness", () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 10,000 sessions distributed across days
    const sessions: FocusSession[] = Array.from({ length: 10000 }).map((_, i) => {
      const day = addDays(weekStart, i % 14 - 3); // some in-week, some out-of-week
      day.setHours(9 + (i % 8), 0, 0, 0);
      return {
        id: `s-${i}`,
        date: day.toISOString(),
        durationMin: 25,
        taskTitle: `Task ${i % 5}`,
      };
    });

    // Establish correctness with a small run
    const result = getWeeklyFocus(sessions, now);
    expect(result).toHaveLength(7);
    expect(result[0].day).toBe("Mon");

    // Profile the execution time for 10 runs of getWeeklyFocus
    const start = performance.now();
    for (let i = 0; i < 10; i++) {
      getWeeklyFocus(sessions, now);
    }
    const end = performance.now();
    const duration = end - start;

    console.log(`[BENCHMARK] getWeeklyFocus with 10,000 sessions (10 iterations): ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(10000); // Fail-safe limit
  }, { timeout: 20000 });
});
