import { describe, test, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { addDays, format, startOfWeek } from "date-fns";

describe("analytics_bolt optimization", () => {
  test("getWeeklyFocus accurately aggregates focus session durations", () => {
    const now = new Date("2025-05-14T12:00:00Z"); // Wednesday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Mon May 12 2025

    const monDate = format(weekStart, "yyyy-MM-dd'T'10:00:00'Z'");
    const wedDate = format(addDays(weekStart, 2), "yyyy-MM-dd'T'14:00:00'Z'");
    const friDate = format(addDays(weekStart, 4), "yyyy-MM-dd'T'16:00:00'Z'");
    const outsideDate = format(addDays(weekStart, 10), "yyyy-MM-dd'T'10:00:00'Z'");

    const mockSessions: FocusSession[] = [
      { id: "1", userId: "u1", date: monDate, durationMin: 45, completed: true, createdAt: monDate },
      { id: "2", userId: "u1", date: monDate, durationMin: 30, completed: true, createdAt: monDate },
      { id: "3", userId: "u1", date: wedDate, durationMin: 60, completed: true, createdAt: wedDate },
      { id: "4", userId: "u1", date: friDate, durationMin: 25, completed: true, createdAt: friDate },
      { id: "5", userId: "u1", date: outsideDate, durationMin: 90, completed: true, createdAt: outsideDate },
    ];

    const result = getWeeklyFocus(mockSessions, now);

    expect(result).toHaveLength(7);
    expect(result.find((d) => d.day === "Mon")?.minutes).toBe(75);
    expect(result.find((d) => d.day === "Tue")?.minutes).toBe(0);
    expect(result.find((d) => d.day === "Wed")?.minutes).toBe(60);
    expect(result.find((d) => d.day === "Thu")?.minutes).toBe(0);
    expect(result.find((d) => d.day === "Fri")?.minutes).toBe(25);
    expect(result.find((d) => d.day === "Sat")?.minutes).toBe(0);
    expect(result.find((d) => d.day === "Sun")?.minutes).toBe(0);
  });

  test(
    "getWeeklyFocus performance benchmark on large session array",
    () => {
      const now = new Date("2025-05-14T12:00:00Z");
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });

      // Generate 14,000 sessions distributed across 14 days
      const mockSessions: FocusSession[] = Array.from({ length: 14000 }, (_, i) => {
        const sessionDate = addDays(weekStart, i % 14);
        return {
          id: `session-${i}`,
          userId: "u1",
          date: format(sessionDate, "yyyy-MM-dd'T'10:00:00'Z'"),
          durationMin: 15,
          completed: true,
          createdAt: format(sessionDate, "yyyy-MM-dd'T'10:00:00'Z'"),
        };
      });

      // Warm-up call
      getWeeklyFocus(mockSessions, now);

      const iterations = 50;
      const startTime = performance.now();
      for (let i = 0; i < iterations; i++) {
        getWeeklyFocus(mockSessions, now);
      }
      const endTime = performance.now();
      const avgDurationMs = (endTime - startTime) / iterations;

      console.log(`getWeeklyFocus average execution time over 14,000 sessions: ${avgDurationMs.toFixed(2)}ms`);

      // Ensure benchmark assertion threshold accounts for execution variances in CI environments while verifying efficiency
      expect(avgDurationMs).toBeLessThan(200);
    },
    20000
  );
});
