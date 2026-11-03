import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { addDays, startOfWeek, format } from "date-fns";

describe("getWeeklyFocus (Bolt Optimization)", () => {
  it("correctly aggregates focus minutes for current week days", () => {
    const now = new Date(2025, 2, 10); // Monday, March 10, 2025
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    const mondayDate = format(addDays(weekStart, 0), "yyyy-MM-dd'T'10:00:00'Z'");
    const wednesdayDate = format(addDays(weekStart, 2), "yyyy-MM-dd'T'14:30:00'Z'");
    const sundayDate = format(addDays(weekStart, 6), "yyyy-MM-dd'T'20:00:00'Z'");

    const sessions: FocusSession[] = [
      { id: "1", durationMin: 25, date: mondayDate, taskTitle: "Task 1" },
      { id: "2", durationMin: 45, date: mondayDate, taskTitle: "Task 2" },
      { id: "3", durationMin: 50, date: wednesdayDate, taskTitle: "Task 3" },
      { id: "4", durationMin: 30, date: sundayDate, taskTitle: "Task 4" },
    ];

    const weekly = getWeeklyFocus(sessions, now);

    expect(weekly).toHaveLength(7);
    expect(weekly[0]).toEqual({ day: "Mon", date: format(addDays(weekStart, 0), "yyyy-MM-dd"), minutes: 70 });
    expect(weekly[1]).toEqual({ day: "Tue", date: format(addDays(weekStart, 1), "yyyy-MM-dd"), minutes: 0 });
    expect(weekly[2]).toEqual({ day: "Wed", date: format(addDays(weekStart, 2), "yyyy-MM-dd"), minutes: 50 });
    expect(weekly[3]).toEqual({ day: "Thu", date: format(addDays(weekStart, 3), "yyyy-MM-dd"), minutes: 0 });
    expect(weekly[4]).toEqual({ day: "Fri", date: format(addDays(weekStart, 4), "yyyy-MM-dd"), minutes: 0 });
    expect(weekly[5]).toEqual({ day: "Sat", date: format(addDays(weekStart, 5), "yyyy-MM-dd"), minutes: 0 });
    expect(weekly[6]).toEqual({ day: "Sun", date: format(addDays(weekStart, 6), "yyyy-MM-dd"), minutes: 30 });
  });

  it("handles empty session list efficiently", () => {
    const now = new Date();
    const weekly = getWeeklyFocus([], now);
    expect(weekly).toHaveLength(7);
    expect(weekly.every((d) => d.minutes === 0)).toBe(true);
  });

  it("executes efficiently over a large session dataset", () => {
    const now = new Date(2025, 2, 10);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 14,000 sessions distributed evenly across days (divisible by 14)
    const sessions: FocusSession[] = [];
    for (let i = 0; i < 14000; i++) {
      const dayOffset = i % 14; // half inside current week, half outside
      const sessionDate = format(addDays(weekStart, dayOffset), "yyyy-MM-dd'T'10:00:00'Z'");
      sessions.push({
        id: `s-${i}`,
        durationMin: 25,
        date: sessionDate,
        taskTitle: "Bench task",
      });
    }

    // Warm-up JIT
    getWeeklyFocus(sessions.slice(0, 50), now);

    const start = performance.now();
    const result = getWeeklyFocus(sessions, now);
    const duration = performance.now() - start;

    expect(result).toHaveLength(7);
    // Each day inside the current week should have 1000 sessions * 25 min = 25000 min
    for (let i = 0; i < 7; i++) {
      expect(result[i].minutes).toBe(25000);
    }

    // Benchmark check: O(N) single-pass lookup executes in well under 200ms
    expect(duration).toBeLessThan(200);
  });
});
