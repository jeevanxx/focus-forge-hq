import { describe, test, expect } from "vitest";
import { getWeeklyFocus } from "@/lib/analytics";
import type { FocusSession } from "@/lib/types";
import { startOfWeek, addDays, format } from "date-fns";

describe("getWeeklyFocus", () => {
  test("correctly calculates daily focus minutes for the current week", () => {
    const now = new Date(2025, 2, 10); // Monday, March 10, 2025
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    const mondayISO = format(weekStart, "yyyy-MM-dd'T'10:00:00.000'Z'");
    const wednesdayISO = format(addDays(weekStart, 2), "yyyy-MM-dd'T'14:00:00.000'Z'");

    const mockSessions: FocusSession[] = [
      { id: "1", date: mondayISO, durationMin: 30, completed: true, userId: "u1" },
      { id: "2", date: mondayISO, durationMin: 25, completed: true, userId: "u1" },
      { id: "3", date: wednesdayISO, durationMin: 45, completed: true, userId: "u1" },
    ];

    const result = getWeeklyFocus(mockSessions, now);

    expect(result).toHaveLength(7);
    expect(result[0].day).toBe("Mon");
    expect(result[0].minutes).toBe(55);
    expect(result[1].day).toBe("Tue");
    expect(result[1].minutes).toBe(0);
    expect(result[2].day).toBe("Wed");
    expect(result[2].minutes).toBe(45);
  });

  test("performance benchmark with large session dataset", () => {
    const now = new Date(2025, 2, 10);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 14,000 focus sessions distributed across 14 days (7 in-week, 7 out-of-week)
    const sessions: FocusSession[] = [];
    const totalCount = 14000;

    for (let i = 0; i < totalCount; i++) {
      const dayOffset = i % 14; // 0..6 inside week, 7..13 outside week
      const date = addDays(weekStart, dayOffset);
      sessions.push({
        id: `session-${i}`,
        date: format(date, "yyyy-MM-dd'T'10:00:00.000'Z'"),
        durationMin: 10,
        completed: true,
        userId: "user-1",
      });
    }

    // Warm-up call to avoid measuring JIT compilation
    getWeeklyFocus(sessions.slice(0, 100), now);

    const start = performance.now();
    const result = getWeeklyFocus(sessions, now);
    const durationMs = performance.now() - start;

    console.log(`getWeeklyFocus for ${totalCount} sessions took ${durationMs.toFixed(2)}ms`);

    expect(result).toHaveLength(7);
    // 14,000 / 14 = 1,000 sessions per dayOffset.
    // Each day in week (0..6) has 1,000 sessions * 10 min = 10,000 min
    for (const day of result) {
      expect(day.minutes).toBe(10000);
    }
  }, 20000);
});
