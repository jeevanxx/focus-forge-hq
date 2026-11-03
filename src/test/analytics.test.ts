import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { startOfWeek, addDays, format } from "date-fns";

describe("getWeeklyFocus analytics optimization test", () => {
  it("correctly calculates weekly focus minutes per day", () => {
    const now = new Date("2025-01-15T12:00:00Z"); // Wednesday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday Jan 13, 2025

    const monDate = format(addDays(weekStart, 0), "yyyy-MM-dd");
    const wedDate = format(addDays(weekStart, 2), "yyyy-MM-dd");

    const sessions: FocusSession[] = [
      {
        id: "1",
        user_id: "u1",
        date: `${monDate}T09:00:00.000Z`,
        durationMin: 30,
        completed: true,
      },
      {
        id: "2",
        user_id: "u1",
        date: `${monDate}T14:00:00.000Z`,
        durationMin: 45,
        completed: true,
      },
      {
        id: "3",
        user_id: "u1",
        date: `${wedDate}T10:00:00.000Z`,
        durationMin: 60,
        completed: true,
      },
    ];

    const result = getWeeklyFocus(sessions, now);

    expect(result).toHaveLength(7);
    expect(result[0]).toEqual({ day: "Mon", date: monDate, minutes: 75 });
    expect(result[1].minutes).toBe(0);
    expect(result[2]).toEqual({ day: "Wed", date: wedDate, minutes: 60 });
  });

  it("benchmarks performance with 14,000 sessions", () => {
    const now = new Date("2025-01-15T12:00:00Z");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 14,000 focus sessions spread across 14 days (half inside current week, half outside)
    // 14,000 is a multiple of 14, so sessions are evenly distributed.
    const sessions: FocusSession[] = [];
    for (let i = 0; i < 14000; i++) {
      const dayOffset = i % 14;
      const sessionDate = addDays(weekStart, dayOffset - 3); // some before weekStart, some inside
      const isoDate = `${format(sessionDate, "yyyy-MM-dd")}T10:00:00.000Z`;
      sessions.push({
        id: `s-${i}`,
        user_id: "u1",
        date: isoDate,
        durationMin: 25,
        completed: true,
      });
    }

    // Warm-up call
    getWeeklyFocus(sessions, now);

    const runs = 20;
    const start = performance.now();
    for (let r = 0; r < runs; r++) {
      getWeeklyFocus(sessions, now);
    }
    const elapsed = performance.now() - start;
    const avgMs = elapsed / runs;

    console.log(`[BENCHMARK] Average execution time for 14,000 sessions: ${avgMs.toFixed(2)} ms`);

    expect(avgMs).toBeGreaterThan(0);
  }, 20000);
});
