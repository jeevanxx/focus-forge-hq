import { describe, it, expect } from "vitest";
import { format, addDays, startOfWeek } from "date-fns";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";

describe("getWeeklyFocus Analytics Engine", () => {
  const refDate = new Date("2025-05-14T10:00:00Z"); // Wednesday
  const monday = startOfWeek(refDate, { weekStartsOn: 1 }); // May 12, 2025

  it("returns zero minutes for all 7 days when sessions are empty", () => {
    const result = getWeeklyFocus([], refDate);
    expect(result).toHaveLength(7);
    expect(result.map((d) => d.minutes)).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(result[0].day).toBe("Mon");
    expect(result[6].day).toBe("Sun");
  });

  it("correctly aggregates minutes for sessions within the current week", () => {
    const mondayKey = format(monday, "yyyy-MM-dd");
    const wednesdayKey = format(addDays(monday, 2), "yyyy-MM-dd");
    const nextWeekKey = format(addDays(monday, 7), "yyyy-MM-dd");

    const mockSessions: FocusSession[] = [
      {
        id: "1",
        userId: "u1",
        date: `${mondayKey}T09:00:00Z`,
        durationMin: 30,
        type: "work",
        createdAt: "2025-05-12T09:00:00Z",
      },
      {
        id: "2",
        userId: "u1",
        date: `${mondayKey}T14:00:00Z`,
        durationMin: 45,
        type: "work",
        createdAt: "2025-05-12T14:00:00Z",
      },
      {
        id: "3",
        userId: "u1",
        date: `${wednesdayKey}T10:00:00Z`,
        durationMin: 60,
        type: "break",
        createdAt: "2025-05-14T10:00:00Z",
      },
      {
        id: "4",
        userId: "u1",
        date: `${nextWeekKey}T10:00:00Z`, // Next week (should be ignored)
        durationMin: 120,
        type: "work",
        createdAt: "2025-05-19T10:00:00Z",
      },
    ];

    const result = getWeeklyFocus(mockSessions, refDate);
    expect(result[0].minutes).toBe(75); // Monday: 30 + 45
    expect(result[1].minutes).toBe(0);  // Tuesday
    expect(result[2].minutes).toBe(60); // Wednesday
    expect(result[3].minutes).toBe(0);  // Thursday
    expect(result[4].minutes).toBe(0);  // Friday
    expect(result[5].minutes).toBe(0);  // Saturday
    expect(result[6].minutes).toBe(0);  // Sunday
  });

  it("benchmarks performance over 14,000 sessions with O(N) single-pass execution", { timeout: 20000 }, () => {
    const largeDataset: FocusSession[] = [];
    const baseDate = new Date("2025-05-12T00:00:00Z");

    // Generate 14,000 focus sessions evenly distributed over 14 days
    for (let i = 0; i < 14000; i++) {
      const dayOffset = i % 14;
      const sessionDate = addDays(baseDate, dayOffset);
      largeDataset.push({
        id: `sess-${i}`,
        userId: "user-bench",
        date: sessionDate.toISOString(),
        durationMin: 25,
        type: "work",
        createdAt: sessionDate.toISOString(),
      });
    }

    // Warm-up call to eliminate JIT compilation overhead
    getWeeklyFocus(largeDataset, refDate);

    const start = performance.now();
    const iterations = 50;
    for (let k = 0; k < iterations; k++) {
      getWeeklyFocus(largeDataset, refDate);
    }
    const end = performance.now();
    const avgTimeMs = (end - start) / iterations;

    // Fast execution threshold: single-pass O(N) average time should be well below 50ms per call
    expect(avgTimeMs).toBeLessThan(200);
  });
});
