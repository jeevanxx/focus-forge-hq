import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { addDays, startOfWeek, format } from "date-fns";

describe("getWeeklyFocus performance & correctness", () => {
  it("correctly aggregates focus minutes per day for current week", () => {
    const now = new Date("2025-01-15T12:00:00.000Z"); // Wednesday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday Jan 13

    const monDate = format(addDays(weekStart, 0), "yyyy-MM-dd");
    const wedDate = format(addDays(weekStart, 2), "yyyy-MM-dd");

    const sessions: FocusSession[] = [
      { id: "1", date: `${monDate}T09:00:00.000Z`, durationMin: 30 },
      { id: "2", date: `${monDate}T14:00:00.000Z`, durationMin: 45 },
      { id: "3", date: `${wedDate}T10:00:00.000Z`, durationMin: 60 },
      { id: "4", date: "2024-01-01T10:00:00.000Z", durationMin: 120 }, // out of range
    ];

    const result = getWeeklyFocus(sessions, now);

    expect(result).toHaveLength(7);
    expect(result[0]).toEqual({ day: "Mon", date: monDate, minutes: 75 });
    expect(result[2]).toEqual({ day: "Wed", date: wedDate, minutes: 60 });
    expect(result[1].minutes).toBe(0); // Tue
  });

  it("benchmarks single-pass getWeeklyFocus with large session array", { timeout: 30000 }, () => {
    const now = new Date("2025-01-15T12:00:00.000Z");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 14,000 sessions (multiple of 14)
    const sessions: FocusSession[] = [];
    for (let i = 0; i < 14000; i++) {
      const dayOffset = i % 14; // 0..6 inside week, 7..13 outside week
      const sessionDate = format(addDays(weekStart, dayOffset), "yyyy-MM-dd");
      sessions.push({
        id: `session-${i}`,
        date: `${sessionDate}T10:00:00.000Z`,
        durationMin: 10,
      });
    }

    // Warm-up call
    getWeeklyFocus(sessions, now);

    const startTime = performance.now();
    const runs = 5;
    for (let r = 0; r < runs; r++) {
      getWeeklyFocus(sessions, now);
    }
    const endTime = performance.now();
    const avgDuration = (endTime - startTime) / runs;

    console.log(`[BENCHMARK] getWeeklyFocus avg duration: ${avgDuration.toFixed(2)}ms for 14,000 sessions`);

    const result = getWeeklyFocus(sessions, now);
    // 14000 / 14 = 1000 sessions per dayOffset.
    // Each day inside the week (indices 0..6) gets 1000 sessions * 10 mins = 10,000 mins
    expect(result[0].minutes).toBe(10000);
    expect(result[6].minutes).toBe(10000);
  });
});
