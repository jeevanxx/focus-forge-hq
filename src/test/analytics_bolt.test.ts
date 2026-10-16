import { describe, test, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { startOfWeek, addDays, format, subDays } from "date-fns";

describe("getWeeklyFocus", () => {
  const referenceDate = new Date(2025, 2, 3); // Monday, March 3, 2025

  test("handles empty sessions array", () => {
    const result = getWeeklyFocus([], referenceDate);
    expect(result).toHaveLength(7);
    expect(result.every((d) => d.minutes === 0)).toBe(true);
    expect(result[0].day).toBe("Mon");
    expect(result[0].date).toBe("2025-03-03");
    expect(result[6].day).toBe("Sun");
    expect(result[6].date).toBe("2025-03-09");
  });

  test("correctly aggregates focus sessions within the week", () => {
    const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
    const monDate = format(addDays(weekStart, 0), "yyyy-MM-dd'T'10:00:00");
    const wedDate1 = format(addDays(weekStart, 2), "yyyy-MM-dd'T'09:00:00");
    const wedDate2 = format(addDays(weekStart, 2), "yyyy-MM-dd'T'14:30:00");

    const mockSessions: FocusSession[] = [
      { id: "1", date: monDate, durationMin: 45, user_id: "user1" },
      { id: "2", date: wedDate1, durationMin: 30, user_id: "user1" },
      { id: "3", date: wedDate2, durationMin: 60, user_id: "user1" },
    ];

    const result = getWeeklyFocus(mockSessions, referenceDate);
    expect(result[0].minutes).toBe(45); // Mon
    expect(result[1].minutes).toBe(0);  // Tue
    expect(result[2].minutes).toBe(90); // Wed (30 + 60)
    expect(result[3].minutes).toBe(0);  // Thu
  });

  test("ignores focus sessions outside current week", () => {
    const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
    const pastDate = format(subDays(weekStart, 2), "yyyy-MM-dd'T'10:00:00");
    const futureDate = format(addDays(weekStart, 10), "yyyy-MM-dd'T'10:00:00");

    const mockSessions: FocusSession[] = [
      { id: "1", date: pastDate, durationMin: 60, user_id: "user1" },
      { id: "2", date: futureDate, durationMin: 60, user_id: "user1" },
    ];

    const result = getWeeklyFocus(mockSessions, referenceDate);
    expect(result.every((d) => d.minutes === 0)).toBe(true);
  });

  test("performance on large dataset (14,000 sessions)", () => {
    const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
    const sessions: FocusSession[] = [];
    const totalSessions = 14000; // Perfect multiple of 14

    for (let i = 0; i < totalSessions; i++) {
      // Evenly distribute sessions across 14 days (7 days in week, 7 days outside week)
      const dayOffset = (i % 14) - 3;
      const sessionDate = addDays(weekStart, dayOffset);
      const isoDate = format(sessionDate, "yyyy-MM-dd'T'12:00:00");
      sessions.push({
        id: `sess-${i}`,
        date: isoDate,
        durationMin: 10,
        user_id: "user1",
      });
    }

    // Warm up
    getWeeklyFocus(sessions, referenceDate);

    const start = performance.now();
    const result = getWeeklyFocus(sessions, referenceDate);
    const duration = performance.now() - start;

    expect(result).toHaveLength(7);
    // 14000 total / 14 days = 1000 sessions per day * 10 mins = 10000 mins per day
    expect(result[0].minutes).toBe(10000);
    expect(result[6].minutes).toBe(10000);
    expect(duration).toBeLessThan(500); // Generous threshold to prevent CI flakiness
  }, 20000);
});
