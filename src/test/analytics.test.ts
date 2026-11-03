import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "@/lib/analytics";
import type { FocusSession } from "@/lib/types";
import { addDays, startOfWeek, format } from "date-fns";

describe("getWeeklyFocus", () => {
  const now = new Date("2025-02-19T12:00:00Z"); // Wednesday

  it("returns 7 days starting from Monday for empty sessions", () => {
    const res = getWeeklyFocus([], now);
    expect(res).toHaveLength(7);
    expect(res[0].day).toBe("Mon");
    expect(res[6].day).toBe("Sun");
    expect(res.every((d) => d.minutes === 0)).toBe(true);
  });

  it("correctly aggregates focus minutes for current week days", () => {
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monStr = format(weekStart, "yyyy-MM-dd") + "T10:00:00Z";
    const wedStr = format(addDays(weekStart, 2), "yyyy-MM-dd") + "T14:00:00Z";
    const nextWeekStr = format(addDays(weekStart, 8), "yyyy-MM-dd") + "T10:00:00Z";

    const sessions: FocusSession[] = [
      { id: "1", date: monStr, durationMin: 25 },
      { id: "2", date: monStr, durationMin: 50 },
      { id: "3", date: wedStr, durationMin: 30 },
      { id: "4", date: nextWeekStr, durationMin: 60 }, // outside current week
    ];

    const res = getWeeklyFocus(sessions, now);
    expect(res[0].minutes).toBe(75); // Mon: 25 + 50
    expect(res[2].minutes).toBe(30); // Wed: 30
    expect(res[1].minutes).toBe(0);  // Tue: 0
  });

  it("benchmarks single-pass O(N) performance on 14,000 sessions", () => {
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const totalSessions = 14000;
    const mockSessions: FocusSession[] = [];

    // Ensure overall generated dataset length is a multiple of 14 for even distribution
    for (let i = 0; i < totalSessions; i++) {
      const dayOffset = i % 14;
      const sessionDate = addDays(weekStart, dayOffset);
      mockSessions.push({
        id: `session-${i}`,
        date: sessionDate.toISOString(),
        durationMin: 25,
      });
    }

    // Warm-up call
    getWeeklyFocus(mockSessions, now);

    const runs = 20;
    const t0 = performance.now();
    let totalAggregated = 0;
    for (let r = 0; r < runs; r++) {
      const res = getWeeklyFocus(mockSessions, now);
      totalAggregated += res.reduce((sum, d) => sum + d.minutes, 0);
    }
    const t1 = performance.now();
    const durationMs = t1 - t0;
    const avgMs = durationMs / runs;

    // Expected weekly minutes for 7 days in current week:
    // 7 days * (14,000 / 14 sessions/day) * 25 min = 7 * 1,000 * 25 = 175,000 min
    const expectedWeeklyMin = 175000;
    expect(totalAggregated / runs).toBe(expectedWeeklyMin);

    // Generous threshold for test stability on CI runners (e.g. < 200ms)
    expect(avgMs).toBeLessThan(200);

    console.log(`[Bolt Benchmark] getWeeklyFocus on 14,000 sessions: ~${avgMs.toFixed(2)} ms / call`);
  }, 20000);
});
