import { describe, test, expect } from "vitest";
import { getWeeklyFocus } from "@/lib/analytics";
import type { FocusSession } from "@/lib/types";
import { format, addDays, startOfWeek } from "date-fns";

describe("Analytics Engine - getWeeklyFocus", () => {
  test("correctly calculates weekly focus minutes per day", () => {
    const now = new Date("2025-02-19T12:00:00Z"); // Wed
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Mon 2025-02-17

    const sessions: FocusSession[] = [
      {
        id: "1",
        userId: "u1",
        taskId: "t1",
        durationMin: 30,
        date: format(addDays(weekStart, 0), "yyyy-MM-dd'T'10:00:00"), // Mon
      },
      {
        id: "2",
        userId: "u1",
        taskId: "t2",
        durationMin: 45,
        date: format(addDays(weekStart, 0), "yyyy-MM-dd'T'14:00:00"), // Mon
      },
      {
        id: "3",
        userId: "u1",
        taskId: "t3",
        durationMin: 60,
        date: format(addDays(weekStart, 2), "yyyy-MM-dd'T'09:00:00"), // Wed
      },
      {
        id: "4",
        userId: "u1",
        taskId: "t4",
        durationMin: 25,
        date: format(addDays(weekStart, 6), "yyyy-MM-dd'T'16:00:00"), // Sun
      },
    ];

    const weekly = getWeeklyFocus(sessions, now);

    expect(weekly).toHaveLength(7);
    expect(weekly[0]).toEqual({
      day: "Mon",
      date: format(addDays(weekStart, 0), "yyyy-MM-dd"),
      minutes: 75,
    });
    expect(weekly[1].minutes).toBe(0); // Tue
    expect(weekly[2]).toEqual({
      day: "Wed",
      date: format(addDays(weekStart, 2), "yyyy-MM-dd"),
      minutes: 60,
    });
    expect(weekly[6]).toEqual({
      day: "Sun",
      date: format(addDays(weekStart, 6), "yyyy-MM-dd"),
      minutes: 25,
    });
  });

  test(
    "performance benchmark - getWeeklyFocus executes rapidly for 14,000 sessions",
    () => {
      const now = new Date("2025-02-19T12:00:00Z");
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });

      // Generate 14,000 sessions distributed evenly across 14 days (7 in current week, 7 outside)
      const mockSessions: FocusSession[] = [];
      const totalSessions = 14000;
      for (let i = 0; i < totalSessions; i++) {
        const dayOffset = i % 14; // Exactly 1,000 sessions per day offset
        const sessionDate = addDays(weekStart, dayOffset);
        mockSessions.push({
          id: `s-${i}`,
          userId: "user-1",
          taskId: `t-${i}`,
          durationMin: 25,
          date: format(sessionDate, "yyyy-MM-dd'T'10:00:00"),
        });
      }

      // Warm-up call to eliminate initial JIT / compilation overhead
      getWeeklyFocus(mockSessions, now);

      const iterations = 10;
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        getWeeklyFocus(mockSessions, now);
      }
      const elapsed = performance.now() - start;
      const avgDuration = elapsed / iterations;

      const result = getWeeklyFocus(mockSessions, now);
      // Mon to Sun (indices 0..6) should each have 1,000 sessions of 25 min = 25,000 min
      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        expect(result[dayIdx].minutes).toBe(25000);
      }

      // Single-pass O(N) map implementation executes in under 200ms
      expect(avgDuration).toBeLessThan(200);
    },
    20000
  );
});
