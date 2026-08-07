import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";

describe("getWeeklyFocus - performance & correctness", () => {
  it("correctly aggregates focus minutes for the week", () => {
    const now = new Date("2023-10-15T12:00:00.000Z"); // Sunday
    const sessions: FocusSession[] = [
      { id: "1", date: "2023-10-09T08:00:00.000Z", durationMin: 45 }, // Mon
      { id: "2", date: "2023-10-09T14:30:00.000Z", durationMin: 60 }, // Mon
      { id: "3", date: "2023-10-11T10:15:00.000Z", durationMin: 30 }, // Wed
      { id: "4", date: "2023-10-15T18:00:00.000Z", durationMin: 90 }, // Sun
      { id: "5", date: "2023-10-16T09:00:00.000Z", durationMin: 50 }, // Next Mon (outside)
    ];

    const weekly = getWeeklyFocus(sessions, now);

    expect(weekly).toHaveLength(7);
    expect(weekly[0]).toEqual({ day: "Mon", date: "2023-10-09", minutes: 105 });
    expect(weekly[1]).toEqual({ day: "Tue", date: "2023-10-10", minutes: 0 });
    expect(weekly[2]).toEqual({ day: "Wed", date: "2023-10-11", minutes: 30 });
    expect(weekly[3]).toEqual({ day: "Thu", date: "2023-10-12", minutes: 0 });
    expect(weekly[4]).toEqual({ day: "Fri", date: "2023-10-13", minutes: 0 });
    expect(weekly[5]).toEqual({ day: "Sat", date: "2023-10-14", minutes: 0 });
    expect(weekly[6]).toEqual({ day: "Sun", date: "2023-10-15", minutes: 90 });
  });

  it("profiles and runs O(N) single-pass aggregation efficiently under large loads", { timeout: 20000 }, () => {
    const now = new Date("2023-10-15T12:00:00.000Z");
    const testSize = 10000;
    const sessions: FocusSession[] = [];

    // Generate 10,000 mock sessions
    for (let i = 0; i < testSize; i++) {
      const daysOffset = i % 10; // Mix within and outside the target week
      const date = new Date(now.getTime() - daysOffset * 24 * 60 * 60 * 1000);
      sessions.push({
        id: `session-${i}`,
        date: date.toISOString(),
        durationMin: 15,
      });
    }

    // Warm up call to ensure JIT/compilation overhead is not measured
    getWeeklyFocus(sessions.slice(0, 100), now);

    const start = performance.now();
    const result = getWeeklyFocus(sessions, now);
    const end = performance.now();

    expect(result).toHaveLength(7);

    // Ensure the execution time is extremely low (typically < 15ms for O(N) with warmup)
    const elapsed = end - start;
    console.log(`[Bolt Profile] getWeeklyFocus with ${testSize} sessions took ${elapsed.toFixed(2)}ms`);
    expect(elapsed).toBeLessThan(200); // Generous threshold to prevent fragile test failures on slower CI
  });
});
