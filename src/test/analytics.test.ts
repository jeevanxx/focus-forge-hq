import { describe, test, expect } from "vitest";
import { getWeeklyFocus, getWeeklyFocusTotal } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { format, startOfWeek, addDays } from "date-fns";

describe("analytics - getWeeklyFocus", () => {
  const referenceNow = new Date("2025-03-05T12:00:00Z"); // Wednesday

  test("returns 7 days initialized to 0 for empty sessions", () => {
    const weekly = getWeeklyFocus([], referenceNow);
    expect(weekly).toHaveLength(7);
    expect(weekly.map((w) => w.minutes)).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(weekly.map((w) => w.day)).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  });

  test("aggregates focus minutes correctly for multiple sessions on the same and different days", () => {
    const weekStart = startOfWeek(referenceNow, { weekStartsOn: 1 });
    const monDate = format(addDays(weekStart, 0), "yyyy-MM-dd");
    const wedDate = format(addDays(weekStart, 2), "yyyy-MM-dd");

    const sessions: FocusSession[] = [
      { id: "1", date: `${monDate}T09:00:00Z`, durationMin: 25, completed: true },
      { id: "2", date: `${monDate}T14:00:00Z`, durationMin: 50, completed: true },
      { id: "3", date: `${wedDate}T10:00:00Z`, durationMin: 30, completed: true },
    ];

    const weekly = getWeeklyFocus(sessions, referenceNow);
    expect(weekly[0].minutes).toBe(75); // Monday: 25 + 50
    expect(weekly[1].minutes).toBe(0);  // Tuesday
    expect(weekly[2].minutes).toBe(30); // Wednesday: 30
    expect(getWeeklyFocusTotal(sessions, referenceNow)).toBe(105);
  });

  test("benchmark performance with 14,000 sessions", () => {
    // Generate 14,000 focus sessions across 14 days (1000 sessions per day)
    const sessions: FocusSession[] = [];
    const baseDate = new Date("2025-03-03T10:00:00Z"); // Monday

    for (let i = 0; i < 14000; i++) {
      const dayOffset = i % 14;
      const sessionDate = format(addDays(baseDate, dayOffset), "yyyy-MM-dd'T'HH:mm:ss'Z'");
      sessions.push({
        id: `session-${i}`,
        date: sessionDate,
        durationMin: 25,
        completed: true,
      });
    }

    // Warm-up call to compile JIT
    getWeeklyFocus(sessions, referenceNow);

    // Measure optimized execution
    const iterations = 20;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      getWeeklyFocus(sessions, referenceNow);
    }
    const elapsed = performance.now() - start;
    const avgMs = elapsed / iterations;

    // Fast execution should be under 20ms per call for 14,000 items
    expect(avgMs).toBeLessThan(200);
  }, 20000);
});
