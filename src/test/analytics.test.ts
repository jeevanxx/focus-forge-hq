import { describe, test, expect } from "vitest";
import { getWeeklyFocus, getWeeklyFocusTotal } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { format, startOfWeek, addDays } from "date-fns";

describe("getWeeklyFocus", () => {
  const now = new Date(2025, 0, 15); // Wednesday Jan 15, 2025
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday Jan 13, 2025

  test("handles empty sessions array", () => {
    const result = getWeeklyFocus([], now);
    expect(result).toHaveLength(7);
    result.forEach((day) => {
      expect(day.minutes).toBe(0);
    });
  });

  test("aggregates sessions correctly for days in current week", () => {
    const monDate = format(weekStart, "yyyy-MM-dd");
    const wedDate = format(addDays(weekStart, 2), "yyyy-MM-dd");
    const outsideDate = "2024-12-01";

    const sessions: FocusSession[] = [
      { id: "1", userId: "u1", date: `${monDate}T10:00:00.000Z`, durationMin: 30, createdAt: "" },
      { id: "2", userId: "u1", date: `${monDate}T14:00:00.000Z`, durationMin: 45, createdAt: "" },
      { id: "3", userId: "u1", date: `${wedDate}T09:00:00.000Z`, durationMin: 60, createdAt: "" },
      { id: "4", userId: "u1", date: `${outsideDate}T12:00:00.000Z`, durationMin: 120, createdAt: "" },
    ];

    const result = getWeeklyFocus(sessions, now);
    expect(result[0].minutes).toBe(75); // Mon
    expect(result[1].minutes).toBe(0);  // Tue
    expect(result[2].minutes).toBe(60); // Wed
    expect(result[3].minutes).toBe(0);  // Thu

    expect(getWeeklyFocusTotal(sessions, now)).toBe(135);
  });

  test("runs efficiently on a large dataset (14,000 sessions)", () => {
    // Generate 14,000 sessions distributed across 14 days (7 in week, 7 out of week)
    const sessions: FocusSession[] = [];
    const baseDate = weekStart;

    for (let i = 0; i < 14000; i++) {
      const dayOffset = (i % 14) - 3; // some before week, some during week, some after
      const sessionDate = format(addDays(baseDate, dayOffset), "yyyy-MM-dd");
      sessions.push({
        id: `session-${i}`,
        userId: "user-1",
        date: `${sessionDate}T10:00:00.000Z`,
        durationMin: 25,
        createdAt: sessionDate,
      });
    }

    // JIT warm-up call
    getWeeklyFocus(sessions, now);

    const start = performance.now();
    const result = getWeeklyFocus(sessions, now);
    const duration = performance.now() - start;

    expect(result).toHaveLength(7);
    // 14,000 / 14 = 1,000 sessions per day offset.
    // Days in current week (dayOffset 0..6) each get 1,000 sessions of 25 min = 25,000 min.
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      expect(result[dayIdx].minutes).toBe(25000);
    }

    // Benchmark assertion: 14k sessions should take well under 200ms
    expect(duration).toBeLessThan(200);
  }, 20000);
});
