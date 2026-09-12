import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { addDays, startOfWeek, format } from "date-fns";

describe("getWeeklyFocus", () => {
  it("correctly aggregates focus minutes per day of the week", () => {
    const now = new Date("2025-01-15T12:00:00Z"); // Wednesday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday 2025-01-13

    const monDate = format(addDays(weekStart, 0), "yyyy-MM-dd");
    const wedDate = format(addDays(weekStart, 2), "yyyy-MM-dd");

    const sessions: FocusSession[] = [
      { id: "1", date: `${monDate}T10:00:00Z`, durationMin: 25, completed: true },
      { id: "2", date: `${monDate}T14:00:00Z`, durationMin: 50, completed: true },
      { id: "3", date: `${wedDate}T09:00:00Z`, durationMin: 30, completed: true },
    ];

    const result = getWeeklyFocus(sessions, now);

    expect(result).toHaveLength(7);
    expect(result[0]).toEqual({ day: "Mon", date: monDate, minutes: 75 });
    expect(result[1]).toEqual({ day: "Tue", date: format(addDays(weekStart, 1), "yyyy-MM-dd"), minutes: 0 });
    expect(result[2]).toEqual({ day: "Wed", date: wedDate, minutes: 30 });
    expect(result[3].minutes).toBe(0);
    expect(result[4].minutes).toBe(0);
    expect(result[5].minutes).toBe(0);
    expect(result[6].minutes).toBe(0);
  });

  it("handles empty sessions array gracefully", () => {
    const now = new Date("2025-01-15T12:00:00Z");
    const result = getWeeklyFocus([], now);
    expect(result).toHaveLength(7);
    result.forEach((d) => expect(d.minutes).toBe(0));
  });

  it("benchmarks execution time on a large dataset", () => {
    const now = new Date("2025-01-15T12:00:00Z");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 14,000 sessions (multiple of 14 so focus is evenly distributed)
    const sessions: FocusSession[] = [];
    for (let i = 0; i < 14000; i++) {
      const dayOffset = i % 14; // includes current week and previous week
      const dateStr = format(addDays(weekStart, dayOffset), "yyyy-MM-dd");
      sessions.push({
        id: `session-${i}`,
        date: `${dateStr}T10:00:00Z`,
        durationMin: 25,
        completed: true,
      });
    }

    // Warm up call
    getWeeklyFocus(sessions, now);

    const start = performance.now();
    const runs = 10;
    for (let i = 0; i < runs; i++) {
      getWeeklyFocus(sessions, now);
    }
    const duration = (performance.now() - start) / runs;
    console.log(`Average execution time for 14,000 sessions: ${duration.toFixed(2)}ms`);

    expect(duration).toBeLessThan(1500); // Generous threshold to allow benchmark test setup
  }, 20000);
});
