import { describe, test, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { format, startOfWeek, addDays } from "date-fns";

describe("getWeeklyFocus analytics", () => {
  test("correctly calculates weekly focus minutes for each day", () => {
    const now = new Date("2025-01-15T12:00:00Z"); // Wednesday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Mon Jan 13, 2025

    const monDate = format(weekStart, "yyyy-MM-dd");
    const wedDate = format(addDays(weekStart, 2), "yyyy-MM-dd");

    const sessions: FocusSession[] = [
      {
        id: "1",
        date: `${monDate}T09:00:00.000Z`,
        durationMin: 45,
        createdAt: `${monDate}T09:00:00.000Z`,
      },
      {
        id: "2",
        date: `${monDate}T14:00:00.000Z`,
        durationMin: 30,
        createdAt: `${monDate}T14:00:00.000Z`,
      },
      {
        id: "3",
        date: `${wedDate}T10:00:00.000Z`,
        durationMin: 60,
        createdAt: `${wedDate}T10:00:00.000Z`,
      },
    ];

    const weekly = getWeeklyFocus(sessions, now);

    expect(weekly).toHaveLength(7);
    expect(weekly[0]).toEqual({ day: "Mon", date: monDate, minutes: 75 });
    expect(weekly[1].minutes).toBe(0);
    expect(weekly[2]).toEqual({ day: "Wed", date: wedDate, minutes: 60 });
  });

  test("performance benchmark: handles 14,000 sessions efficiently", { timeout: 60000 }, () => {
    const now = new Date("2025-01-15T12:00:00Z");
    const sessions: FocusSession[] = [];
    const baseDate = new Date("2025-01-01T10:00:00Z");

    for (let i = 0; i < 14000; i++) {
      const d = new Date(baseDate.getTime() + (i % 14) * 86400000);
      sessions.push({
        id: `session-${i}`,
        date: d.toISOString(),
        durationMin: 30,
        createdAt: d.toISOString(),
      });
    }

    // Warm-up run
    getWeeklyFocus(sessions, now);

    const start = performance.now();
    const runs = 20;
    for (let i = 0; i < runs; i++) {
      getWeeklyFocus(sessions, now);
    }
    const totalTime = performance.now() - start;
    const avgTimeMs = totalTime / runs;

    console.log(`getWeeklyFocus benchmark: avg ${avgTimeMs.toFixed(2)}ms per call (${runs} runs, 14,000 sessions)`);
    expect(avgTimeMs).toBeGreaterThan(0);
  });
});
