import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/mock-data";
import { addDays, startOfWeek, format } from "date-fns";

describe("getWeeklyFocus performance & correctness benchmark", () => {
  it("verifies correctness and measures execution time on 10,000 sessions", { timeout: 30000 }, () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 10,000 mock sessions distributed across the week and some outside the week
    const sessions: FocusSession[] = Array.from({ length: 10000 }).map((_, i) => {
      // Modulo 14 so half of them fall within this week, and half fall in next week
      const dayOffset = i % 14;
      const date = addDays(weekStart, dayOffset);
      return {
        id: `s-${i}`,
        date: date.toISOString(),
        durationMin: 15,
        taskTitle: "Benchmarked Session",
      };
    });

    // Capture baseline/new execution time
    const runs = 100;
    const start = performance.now();
    let result;
    for (let i = 0; i < runs; i++) {
      result = getWeeklyFocus(sessions, now);
    }
    const end = performance.now();
    const avgDuration = (end - start) / runs;

    console.log(`[BENCHMARK] Average execution time for getWeeklyFocus: ${avgDuration.toFixed(4)}ms per call over ${runs} runs.`);

    // Correctness checks
    expect(result).toBeDefined();
    expect(result!.length).toBe(7);

    // Fast calculation of expected minutes
    const expectedMinutes = new Array(7).fill(0);
    for (let i = 0; i < sessions.length; i++) {
      const dayOffset = i % 14;
      if (dayOffset < 7) {
        expectedMinutes[dayOffset] += 15;
      }
    }

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      expect(result![dayIndex].minutes).toBe(expectedMinutes[dayIndex]);
      expect(result![dayIndex].date).toBe(format(addDays(weekStart, dayIndex), "yyyy-MM-dd"));
    }
  });
});
