import { describe, it, expect } from "vitest";
import { getWeeklyFocus, DAILY_FOCUS_GOAL_MIN } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { addDays, startOfWeek, format } from "date-fns";

describe("getWeeklyFocus performance & correctness", () => {
  it("correctly calculates daily focus minutes for the week", () => {
    const now = new Date("2025-03-10T12:00:00Z"); // Monday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // 2025-03-10

    const sessions: FocusSession[] = [
      {
        id: "1",
        date: "2025-03-10T09:00:00Z", // Mon
        durationMin: 30,
        completedAt: "2025-03-10T09:30:00Z",
      },
      {
        id: "2",
        date: "2025-03-10T14:00:00Z", // Mon
        durationMin: 45,
        completedAt: "2025-03-10T14:45:00Z",
      },
      {
        id: "3",
        date: "2025-03-12T10:00:00Z", // Wed
        durationMin: 60,
        completedAt: "2025-03-12T11:00:00Z",
      },
      {
        id: "4",
        date: "2025-03-17T10:00:00Z", // Next week Mon - should not be included in this week's buckets
        durationMin: 120,
        completedAt: "2025-03-17T12:00:00Z",
      },
    ];

    const result = getWeeklyFocus(sessions, now);

    expect(result).toHaveLength(7);
    expect(result[0]).toEqual({
      day: "Mon",
      date: format(weekStart, "yyyy-MM-dd"),
      minutes: 75,
    });
    expect(result[1]).toEqual({
      day: "Tue",
      date: format(addDays(weekStart, 1), "yyyy-MM-dd"),
      minutes: 0,
    });
    expect(result[2]).toEqual({
      day: "Wed",
      date: format(addDays(weekStart, 2), "yyyy-MM-dd"),
      minutes: 60,
    });
  });

  it(
    "handles large dataset efficiently",
    { timeout: 20000 },
    () => {
      const now = new Date("2025-03-10T12:00:00Z"); // Mon
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });

      // Generate 14,000 sessions (multiple of 14 for even distribution)
      const mockSessions: FocusSession[] = [];
      const totalSessions = 14000;

      for (let i = 0; i < totalSessions; i++) {
        // Distribute sessions across 14 days (7 days in target week, 7 days outside target week)
        const dayOffset = i % 14;
        const sessionDate = addDays(weekStart, dayOffset);
        mockSessions.push({
          id: `session-${i}`,
          date: sessionDate.toISOString(),
          durationMin: 20,
          completedAt: sessionDate.toISOString(),
        });
      }

      // Warm-up
      getWeeklyFocus(mockSessions, now);

      // Measure
      const start = performance.now();
      const iterations = 10;
      let lastResult;
      for (let i = 0; i < iterations; i++) {
        lastResult = getWeeklyFocus(mockSessions, now);
      }
      const duration = performance.now() - start;

      console.log(
        `[Benchmark] ${iterations} calls with ${totalSessions} sessions took: ${duration.toFixed(
          2
        )}ms (${(duration / iterations).toFixed(2)}ms / call)`
      );

      expect(lastResult).toHaveLength(7);
      // Each day of target week gets 1000 sessions * 20 min = 20,000 min
      expect(lastResult![0].minutes).toBe(20000);
      expect(lastResult![6].minutes).toBe(20000);
    }
  );
});
