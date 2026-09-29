import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "@/lib/analytics";
import type { FocusSession } from "@/lib/types";
import { addDays, startOfWeek, format } from "date-fns";

describe("analytics - getWeeklyFocus", () => {
  it("correctly aggregates focus minutes for current week days", () => {
    const now = new Date("2025-01-15T12:00:00Z"); // Wednesday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday

    const monDate = format(weekStart, "yyyy-MM-dd");
    const wedDate = format(addDays(weekStart, 2), "yyyy-MM-dd");

    const sessions: FocusSession[] = [
      {
        id: "1",
        durationMin: 25,
        date: `${monDate}T10:00:00.000Z`,
        createdAt: `${monDate}T10:00:00.000Z`,
      },
      {
        id: "2",
        durationMin: 50,
        date: `${monDate}T14:00:00.000Z`,
        createdAt: `${monDate}T14:00:00.000Z`,
      },
      {
        id: "3",
        durationMin: 30,
        date: `${wedDate}T09:00:00.000Z`,
        createdAt: `${wedDate}T09:00:00.000Z`,
      },
    ];

    const weekly = getWeeklyFocus(sessions, now);

    expect(weekly.length).toBe(7);
    expect(weekly[0].day).toBe("Mon");
    expect(weekly[0].minutes).toBe(75);
    expect(weekly[2].day).toBe("Wed");
    expect(weekly[2].minutes).toBe(30);
    expect(weekly[1].minutes).toBe(0); // Tue
  });

  it("handles empty focus sessions gracefully", () => {
    const now = new Date("2025-01-15T12:00:00Z");
    const weekly = getWeeklyFocus([], now);

    expect(weekly.length).toBe(7);
    weekly.forEach((day) => {
      expect(day.minutes).toBe(0);
    });
  });

  it("benchmarks execution performance on large session datasets", () => {
    const now = new Date("2025-01-15T12:00:00Z");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 14,000 sessions evenly distributed across 14 days (2 weeks)
    const totalSessions = 14000;
    const sessions: FocusSession[] = [];
    for (let i = 0; i < totalSessions; i++) {
      const dayOffset = (i % 14) - 3; // offset around current week
      const dateStr = format(addDays(weekStart, dayOffset), "yyyy-MM-dd");
      sessions.push({
        id: `sess-${i}`,
        durationMin: 25,
        date: `${dateStr}T10:00:00.000Z`,
        createdAt: `${dateStr}T10:00:00.000Z`,
      });
    }

    // Warm-up call
    getWeeklyFocus(sessions, now);

    const start = performance.now();
    const iterations = 10;
    for (let i = 0; i < iterations; i++) {
      getWeeklyFocus(sessions, now);
    }
    const duration = performance.now() - start;
    const avgDurationPerCall = duration / iterations;

    // Check correctness on the benchmark result
    const result = getWeeklyFocus(sessions, now);
    expect(result.length).toBe(7);
    expect(result[0].minutes).toBe(1000 * 25); // 1000 sessions per day * 25 min

    // O(N) execution for 14,000 sessions should average under 200ms
    expect(avgDurationPerCall).toBeLessThan(200);
  }, 20000);
});
