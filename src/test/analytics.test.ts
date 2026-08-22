import { describe, test, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { format, addDays, startOfWeek } from "date-fns";

describe("getWeeklyFocus analytics", () => {
  test("correctly aggregates focus minutes for current week days", () => {
    // Mon March 10, 2025
    const now = new Date("2025-03-10T12:00:00.000Z");

    const sessions: FocusSession[] = [
      {
        id: "s1",
        date: "2025-03-10T09:00:00.000Z", // Mon
        durationMin: 30,
        mode: "stopwatch",
        completed: true,
      },
      {
        id: "s2",
        date: "2025-03-10T14:00:00.000Z", // Mon
        durationMin: 30,
        mode: "timer",
        completed: true,
      },
      {
        id: "s3",
        date: "2025-03-12T10:00:00.000Z", // Wed
        durationMin: 45,
        mode: "timer",
        completed: true,
      },
      {
        id: "s4",
        date: "2025-03-16T20:00:00.000Z", // Sun
        durationMin: 90,
        mode: "stopwatch",
        completed: true,
      },
      {
        id: "s5",
        date: "2025-03-01T10:00:00.000Z", // Outside current week
        durationMin: 120,
        mode: "timer",
        completed: true,
      },
    ];

    const weekly = getWeeklyFocus(sessions, now);

    expect(weekly).toHaveLength(7);
    expect(weekly[0]).toEqual({ day: "Mon", date: "2025-03-10", minutes: 60 });
    expect(weekly[1]).toEqual({ day: "Tue", date: "2025-03-11", minutes: 0 });
    expect(weekly[2]).toEqual({ day: "Wed", date: "2025-03-12", minutes: 45 });
    expect(weekly[3]).toEqual({ day: "Thu", date: "2025-03-13", minutes: 0 });
    expect(weekly[4]).toEqual({ day: "Fri", date: "2025-03-14", minutes: 0 });
    expect(weekly[5]).toEqual({ day: "Sat", date: "2025-03-15", minutes: 0 });
    expect(weekly[6]).toEqual({ day: "Sun", date: "2025-03-16", minutes: 90 });
  });

  test("handles large session datasets efficiently in single pass", { timeout: 20000 }, () => {
    const now = new Date("2025-03-10T12:00:00.000Z");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 14,000 sessions (a multiple of 14) spread across two weeks (-7 days to +6 days)
    const totalSessions = 14000;
    const largeSessions: FocusSession[] = new Array(totalSessions);

    for (let i = 0; i < totalSessions; i++) {
      const dayOffset = (i % 14) - 7;
      const sessionDate = format(addDays(weekStart, dayOffset), "yyyy-MM-dd'T'10:00:00.000'Z'");
      largeSessions[i] = {
        id: `bench_${i}`,
        date: sessionDate,
        durationMin: 25,
        mode: "timer",
        completed: true,
      };
    }

    // Warm-up call
    getWeeklyFocus(largeSessions, now);

    const start = performance.now();
    const result = getWeeklyFocus(largeSessions, now);
    const end = performance.now();

    expect(result).toHaveLength(7);
    // Since 14,000 / 14 = 1,000 sessions per day offset, 7 days in week get 1,000 * 25 = 25,000 min each
    for (const d of result) {
      expect(d.minutes).toBe(25000);
    }

    // Execution time should be fast (< 200ms) for 14,000 sessions
    expect(end - start).toBeLessThan(200);
  });
});
