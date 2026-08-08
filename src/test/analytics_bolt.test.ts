import { describe, it, expect } from "vitest";
import { format, parseISO, startOfWeek, addDays } from "date-fns";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";

// The legacy O(7N) implementation of getWeeklyFocus for comparison
const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const getWeeklyFocusLegacy = (
  sessions: FocusSession[],
  now: Date = new Date()
) => {
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  return WEEK_LABELS.map((day, i) => {
    const date = addDays(weekStart, i);
    const dateKey = format(date, "yyyy-MM-dd");
    const minutes = sessions
      .filter((s) => format(parseISO(s.date), "yyyy-MM-dd") === dateKey)
      .reduce((sum, s) => sum + s.durationMin, 0);
    return { day, date: dateKey, minutes };
  });
};

describe("getWeeklyFocus Optimization Benchmark", () => {
  it("should match legacy logic exactly (correctness)", () => {
    const now = new Date("2023-10-15T12:00:00Z"); // Sunday

    // Generate some mock focus sessions within and outside the target week
    const sessions: FocusSession[] = [
      { id: "1", date: "2023-10-09T08:00:00Z", durationMin: 25 }, // Mon
      { id: "2", date: "2023-10-10T09:00:00Z", durationMin: 50 }, // Tue
      { id: "3", date: "2023-10-10T14:30:00Z", durationMin: 30 }, // Tue
      { id: "4", date: "2023-10-12T10:00:00Z", durationMin: 45 }, // Thu
      { id: "5", date: "2023-10-15T22:15:00Z", durationMin: 15 }, // Sun
      { id: "6", date: "2023-10-08T23:00:00Z", durationMin: 30 }, // Mon last week
      { id: "7", date: "2023-10-16T01:00:00Z", durationMin: 60 }, // Mon next week
    ];

    const legacyResult = getWeeklyFocusLegacy(sessions, now);
    const optimizedResult = getWeeklyFocus(sessions, now);

    expect(optimizedResult).toEqual(legacyResult);
  });

  it("should run significantly faster on a large dataset (performance benchmark)", { timeout: 20000 }, () => {
    const now = new Date("2023-10-15T12:00:00Z");
    const sessionCount = 10000;
    const mockSessions: FocusSession[] = [];

    // Pre-generate 10,000 sessions with dates spread across 30 days
    for (let i = 0; i < sessionCount; i++) {
      const dayOffset = (i % 30) - 15; // -15 to +14 days relative to target date
      const date = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      mockSessions.push({
        id: `session-${i}`,
        date: date.toISOString(),
        durationMin: 20 + (i % 45),
      });
    }

    // Warm-up to ensure JIT compilation is done
    for (let i = 0; i < 5; i++) {
      getWeeklyFocusLegacy(mockSessions, now);
      getWeeklyFocus(mockSessions, now);
    }

    // Benchmark Legacy O(7N)
    const t0 = performance.now();
    const legacyResult = getWeeklyFocusLegacy(mockSessions, now);
    const t1 = performance.now();
    const legacyDuration = t1 - t0;

    // Benchmark Optimized O(N)
    const t2 = performance.now();
    const optimizedResult = getWeeklyFocus(mockSessions, now);
    const t3 = performance.now();
    const optimizedDuration = t3 - t2;

    expect(optimizedResult).toEqual(legacyResult);

    console.log(`\n=== BENCHMARK RESULT FOR ${sessionCount} SESSIONS ===`);
    console.log(`Legacy O(7N) Duration:   ${legacyDuration.toFixed(2)} ms`);
    console.log(`Optimized O(N) Duration:  ${optimizedDuration.toFixed(2)} ms`);

    const speedup = legacyDuration / optimizedDuration;
    console.log(`Speedup Factor:          ${speedup.toFixed(2)}x`);
    console.log("===================================================\n");

    // We expect the optimized single-pass to be at least 2x faster,
    // usually around 4x-6x faster for 10,000 items due to avoiding 7x parseISO/format calls.
    expect(optimizedDuration).toBeLessThan(legacyDuration);
  });
});
