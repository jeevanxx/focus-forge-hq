import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import { FocusSession } from "../lib/mock-data";
import { addDays, startOfWeek } from "date-fns";

describe("getWeeklyFocus Benchmark", () => {
  it("should handle 10,000 sessions efficiently", { timeout: 20000 }, () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 10,000 sessions distributed across the week
    const sessions: FocusSession[] = Array.from({ length: 10000 }).map((_, i) => ({
      id: `s${i}`,
      date: addDays(weekStart, i % 7).toISOString(),
      durationMin: 30,
    }));

    const start = performance.now();
    // Run 10 times to get a better average
    for (let i = 0; i < 10; i++) {
      getWeeklyFocus(sessions, now);
    }
    const end = performance.now();

    const duration = (end - start) / 10;
    console.log(`Average getWeeklyFocus duration for 10,000 sessions: ${duration.toFixed(2)}ms`);

    const result = getWeeklyFocus(sessions, now);
    expect(result).toHaveLength(7);
    expect(result[0].minutes).toBeGreaterThan(0);
  });
});
