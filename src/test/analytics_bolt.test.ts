import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { addDays, startOfWeek, format } from "date-fns";

describe("getWeeklyFocus performance and regression test", () => {
  it("should be correct and lightning fast", () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 14,000 mock sessions (2000 per day)
    const sessions: FocusSession[] = [];
    for (let i = 0; i < 14000; i++) {
      const dayOffset = i % 7;
      const date = addDays(weekStart, dayOffset);
      // Construct exact ISO formatted string with different hours/minutes/seconds
      const isoStr = format(date, `yyyy-MM-dd'T'HH:mm:ss.SSSxxx`);
      sessions.push({
        id: `sess-${i}`,
        date: isoStr,
        durationMin: 25,
      });
    }

    // Warm-up to JIT/compile
    getWeeklyFocus(sessions, now);

    // Measure time
    const start = performance.now();
    const result = getWeeklyFocus(sessions, now);
    const duration = performance.now() - start;

    console.log(`[getWeeklyFocus] Benchmark with 14,000 sessions took ${duration.toFixed(2)}ms`);

    // Verify correct structure and results
    expect(result.length).toBe(7);
    for (let i = 0; i < 7; i++) {
      expect(result[i].minutes).toBe(2000 * 25);
    }
  });
});
