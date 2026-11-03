import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import { addDays, startOfWeek, format } from "date-fns";
import type { FocusSession } from "../lib/mock-data";

describe("analytics_bolt", () => {
  it(
    "performs O(N) weekly focus calculations and checks performance with a large dataset",
    () => {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });

      // Generate 10,000 mock sessions distributed throughout the week
      const numSessions = 10000;
      const sessions: FocusSession[] = [];
      for (let i = 0; i < numSessions; i++) {
        const day = addDays(weekStart, i % 7);
        sessions.push({
          id: `s_${i}`,
          date: day.toISOString(),
          durationMin: 25,
        });
      }

      // Profile start time
      const startTime = performance.now();

      // Execute calculation
      const result = getWeeklyFocus(sessions, now);

      // Profile end time
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`[Bolt Benchmark] getWeeklyFocus with 10,000 sessions took ${duration.toFixed(2)}ms`);

      // Verify shape & correctness
      expect(result).toHaveLength(7);
      for (let i = 0; i < 7; i++) {
        const expectedDateKey = format(addDays(weekStart, i), "yyyy-MM-dd");
        expect(result[i].date).toBe(expectedDateKey);
        // Each day of the 7 days gets exactly 10,000 / 7 sessions * 25 mins
        // 10000 / 7 is not an integer. Let's calculate precisely:
        const expectedCount = Math.floor(numSessions / 7) + (i < numSessions % 7 ? 1 : 0);
        expect(result[i].minutes).toBe(expectedCount * 25);
      }

      // Assert it is highly performant (well under 150ms for 10,000 sessions in virtualized CI environments)
      expect(duration).toBeLessThan(150);
    },
    20000 // Configure a generous timeout to prevent premature termination
  );
});
