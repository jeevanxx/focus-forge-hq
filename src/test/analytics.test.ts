import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { addDays, startOfWeek, format } from "date-fns";

describe("analytics - getWeeklyFocus", () => {
  it("correctly calculates daily focus minutes for the week", () => {
    const now = new Date("2025-05-14T12:00:00Z"); // Wednesday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday 2025-05-12

    const mondayDate = format(addDays(weekStart, 0), "yyyy-MM-dd");
    const wednesdayDate = format(addDays(weekStart, 2), "yyyy-MM-dd");

    const sessions: FocusSession[] = [
      { id: "1", task_id: null, task_title: "Task 1", duration_min: 25, durationMin: 25, completed_at: mondayDate, date: mondayDate },
      { id: "2", task_id: null, task_title: "Task 2", duration_min: 35, durationMin: 35, completed_at: mondayDate, date: mondayDate },
      { id: "3", task_id: null, task_title: "Task 3", duration_min: 50, durationMin: 50, completed_at: wednesdayDate, date: wednesdayDate },
    ];

    const result = getWeeklyFocus(sessions, now);

    expect(result).toHaveLength(7);
    expect(result[0]).toEqual({ day: "Mon", date: mondayDate, minutes: 60 });
    expect(result[1]).toEqual({ day: "Tue", date: format(addDays(weekStart, 1), "yyyy-MM-dd"), minutes: 0 });
    expect(result[2]).toEqual({ day: "Wed", date: wednesdayDate, minutes: 50 });
  });

  it("handles benchmarking performance across large datasets", () => {
    const now = new Date("2025-05-14T12:00:00Z");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 14,000 sessions (perfect multiple of 14)
    const sessions: FocusSession[] = Array.from({ length: 14000 }, (_, i) => {
      const dateStr = format(addDays(weekStart, i % 14), "yyyy-MM-dd");
      return {
        id: `s-${i}`,
        task_id: null,
        task_title: `Session ${i}`,
        duration_min: 30,
        durationMin: 30,
        completed_at: dateStr,
        date: dateStr,
      };
    });

    // Warm-up call
    getWeeklyFocus(sessions, now);

    const start = performance.now();
    const result = getWeeklyFocus(sessions, now);
    const duration = performance.now() - start;

    expect(result).toHaveLength(7);
    // Since 14,000 sessions are split evenly over 14 days (1,000 per day), days 0..6 each get 1,000 sessions of 30 min = 30,000 min
    result.forEach((d) => {
      expect(d.minutes).toBe(30000);
    });

    console.log(`getWeeklyFocus execution time for 14,000 sessions: ${duration.toFixed(2)}ms`);
  });
});
