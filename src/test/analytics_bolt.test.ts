import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { subDays } from "date-fns";

describe("getWeeklyFocus performance & correctness", () => {
  it("should correctly aggregate focus sessions for the current week", () => {
    const now = new Date("2026-08-05T12:00:00.000Z"); // Wed Aug 5, 2026

    // We expect the week start to be Mon Aug 3, 2026
    const sessions: FocusSession[] = [
      { id: "1", date: "2026-08-03T09:00:00.000Z", durationMin: 30 }, // Mon
      { id: "2", date: "2026-08-03T14:30:00.000Z", durationMin: 45 }, // Mon
      { id: "3", date: "2026-08-05T10:00:00.000Z", durationMin: 60 }, // Wed
      { id: "4", date: "2026-08-09T20:00:00.000Z", durationMin: 20 }, // Sun
      { id: "5", date: "2026-08-10T09:00:00.000Z", durationMin: 50 }, // Next Mon (should be ignored for this week)
    ];

    const weekly = getWeeklyFocus(sessions, now);

    expect(weekly).toHaveLength(7);

    // Monday Aug 3 should have 75 min
    expect(weekly[0]).toEqual({ day: "Mon", date: "2026-08-03", minutes: 75 });

    // Tuesday Aug 4 should have 0 min
    expect(weekly[1]).toEqual({ day: "Tue", date: "2026-08-04", minutes: 0 });

    // Wednesday Aug 5 should have 60 min
    expect(weekly[2]).toEqual({ day: "Wed", date: "2026-08-05", minutes: 60 });

    // Sunday Aug 9 should have 20 min
    expect(weekly[6]).toEqual({ day: "Sun", date: "2026-08-09", minutes: 20 });
  });

  it("should benchmark getWeeklyFocus performance on 10,000 sessions with O(N) single pass", { timeout: 20000 }, () => {
    const now = new Date("2026-08-05T12:00:00.000Z");

    // Generate 10,000 sessions spread across the past month
    const mockSessions: FocusSession[] = [];
    for (let i = 0; i < 10000; i++) {
      const dateOffset = i % 30; // spread across 30 days
      const sessionDate = subDays(now, dateOffset);
      mockSessions.push({
        id: `s-${i}`,
        date: sessionDate.toISOString(),
        durationMin: 25,
      });
    }

    // Warm-up run to eliminate JIT/compilation overhead
    getWeeklyFocus(mockSessions, now);

    // Profile the execution time
    const start = performance.now();
    const result = getWeeklyFocus(mockSessions, now);
    const duration = performance.now() - start;

    expect(result).toHaveLength(7);

    // Document benchmark performance
    console.log(`[BENCHMARK] getWeeklyFocus with 10,000 sessions took ${duration.toFixed(2)}ms.`);

    // The optimized algorithm should take well under 100ms (typically < 10ms on modern CPUs).
    // We set a generous threshold of 200ms to ensure stability across slower CI environments.
    expect(duration).toBeLessThan(200);
  });
});
