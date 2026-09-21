import { describe, test, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { startOfWeek, addDays, format } from "date-fns";

describe("getWeeklyFocus Optimization Benchmark & Correctness", () => {
  test("correctly calculates daily focus minutes for current week", () => {
    const now = new Date("2025-03-05T12:00:00.000Z"); // Wednesday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Mon March 3

    const monDate = format(addDays(weekStart, 0), "yyyy-MM-dd");
    const wedDate = format(addDays(weekStart, 2), "yyyy-MM-dd");

    const sessions: FocusSession[] = [
      { id: "1", date: `${monDate}T09:00:00.000Z`, durationMin: 45 },
      { id: "2", date: `${monDate}T14:00:00.000Z`, durationMin: 30 },
      { id: "3", date: `${wedDate}T10:00:00.000Z`, durationMin: 60 },
      { id: "4", date: "2024-01-01T10:00:00.000Z", durationMin: 120 }, // out of current week
    ];

    const weekly = getWeeklyFocus(sessions, now);

    expect(weekly).toHaveLength(7);
    expect(weekly[0].day).toBe("Mon");
    expect(weekly[0].minutes).toBe(75); // 45 + 30
    expect(weekly[1].day).toBe("Tue");
    expect(weekly[1].minutes).toBe(0);
    expect(weekly[2].day).toBe("Wed");
    expect(weekly[2].minutes).toBe(60);
  });

  test("benchmarks performance with 14,000 focus sessions", () => {
    const now = new Date("2025-03-05T12:00:00.000Z");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    const totalSessions = 14000;
    const sessions: FocusSession[] = new Array(totalSessions);

    // Distribute sessions evenly across 14 days (7 in-week, 7 out-of-week)
    for (let i = 0; i < totalSessions; i++) {
      const dayOffset = i % 14;
      const sessionDate = addDays(weekStart, dayOffset - 3); // some before, some in-week, some after
      sessions[i] = {
        id: `sess-${i}`,
        date: sessionDate.toISOString(),
        durationMin: 15,
      };
    }

    // Warm-up call
    getWeeklyFocus(sessions, now);

    const start = performance.now();
    const result = getWeeklyFocus(sessions, now);
    const duration = performance.now() - start;

    console.log(`[BENCHMARK] getWeeklyFocus took ${duration.toFixed(2)}ms for ${totalSessions} sessions.`);

    expect(result).toHaveLength(7);
    // Ensure overall total execution remains fast (< 200ms)
    expect(duration).toBeLessThan(200);
  }, 20000);
});
