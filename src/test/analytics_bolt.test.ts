import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/mock-data";
import { startOfWeek, addDays, format } from "date-fns";

describe("getWeeklyFocus performance & correctness", () => {
  it("should correctly aggregate focus sessions for the current week", () => {
    const now = new Date("2026-05-11T12:00:00.000Z"); // A Monday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate some sessions
    const sessions: FocusSession[] = [
      {
        id: "s1",
        date: weekStart.toISOString(), // Monday
        durationMin: 30,
      },
      {
        id: "s2",
        date: addDays(weekStart, 2).toISOString(), // Wednesday
        durationMin: 45,
      },
      {
        id: "s3",
        date: addDays(weekStart, 2).toISOString(), // Wednesday
        durationMin: 15,
      },
      {
        id: "s4",
        date: addDays(weekStart, 6).toISOString(), // Sunday
        durationMin: 60,
      },
      // Sessions outside the current week
      {
        id: "s_prev",
        date: addDays(weekStart, -1).toISOString(), // Previous Sunday
        durationMin: 120,
      },
      {
        id: "s_next",
        date: addDays(weekStart, 7).toISOString(), // Next Monday
        durationMin: 180,
      },
    ];

    const results = getWeeklyFocus(sessions, now);

    // Verify day names and dates
    expect(results).toHaveLength(7);
    expect(results[0].day).toBe("Mon");
    expect(results[0].date).toBe(format(weekStart, "yyyy-MM-dd"));
    expect(results[2].day).toBe("Wed");
    expect(results[2].date).toBe(format(addDays(weekStart, 2), "yyyy-MM-dd"));

    // Verify aggregated minutes
    expect(results[0].minutes).toBe(30); // Monday
    expect(results[1].minutes).toBe(0);  // Tuesday
    expect(results[2].minutes).toBe(60); // Wednesday (45 + 15)
    expect(results[6].minutes).toBe(60); // Sunday
  });

  it("should remain performant O(N) with a large dataset", { timeout: 20000 }, () => {
    const now = new Date("2026-05-11T12:00:00.000Z");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 10,000 sessions
    const largeSessions: FocusSession[] = [];
    for (let i = 0; i < 10000; i++) {
      // Rotate days in the week, some outside
      const dayOffset = (i % 9) - 1; // -1 to 7 (covers previous week, current week, and next week)
      const sessionDate = addDays(weekStart, dayOffset);
      largeSessions.push({
        id: `large_${i}`,
        date: sessionDate.toISOString(),
        durationMin: 10,
      });
    }

    // Warm up JIT compiler
    for (let j = 0; j < 5; j++) {
      getWeeklyFocus(largeSessions, now);
    }

    const start = performance.now();
    const results = getWeeklyFocus(largeSessions, now);
    const end = performance.now();
    const duration = end - start;

    console.log(`⚡ Bolt Bench: getWeeklyFocus for 10,000 sessions took ${duration.toFixed(2)}ms`);

    // Basic correctness assertions on large dataset
    expect(results).toHaveLength(7);

    // Each of the 7 days should have exactly the correct aggregated minutes
    // In our loop, i goes from 0 to 9999.
    // i % 9 gives offsets: -1, 0, 1, 2, 3, 4, 5, 6, 7.
    // Out of every 9 sessions:
    // - Offset -1 is previous week (excluded)
    // - Offset 7 is next week (excluded)
    // - Offsets 0..6 correspond to Mon..Sun (included)
    // There are 10,000 sessions. Let's verify the exact match count.
    const expectedCounts = new Array(7).fill(0);
    for (let i = 0; i < 10000; i++) {
      const offset = (i % 9) - 1;
      if (offset >= 0 && offset < 7) {
        expectedCounts[offset] += 10;
      }
    }

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      expect(results[dayIndex].minutes).toBe(expectedCounts[dayIndex]);
    }

    // O(N) implementation should execute extremely fast. We use a permissive threshold (e.g. 100ms)
    // to ensure reliable test runs in slower, virtualized container or CI environments.
    expect(duration).toBeLessThan(100);
  });
});
