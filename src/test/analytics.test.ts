import { describe, test, expect } from "vitest";
import { format, addDays, startOfWeek } from "date-fns";
import {
  getWeeklyFocus,
  getWeeklyFocusTotal,
  getProductivityScore,
  getCompletionRate,
  getDelayedHighPriority,
  getBestFocusWindow,
  getAverageSessionLength,
  getNextBestAction,
  getCoachInsight,
} from "../lib/analytics";
import type { Task, FocusSession, Habit } from "../lib/types";

describe("Analytics Module Correctness & Performance", () => {
  const now = new Date("2025-01-15T12:00:00Z"); // Wed Jan 15 2025
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Mon Jan 13 2025

  test("getWeeklyFocus returns correct daily focus minutes", () => {
    const mondayStr = format(weekStart, "yyyy-MM-dd'T'10:00:00'Z'");
    const tuesdayStr = format(addDays(weekStart, 1), "yyyy-MM-dd'T'14:00:00'Z'");

    const sessions: FocusSession[] = [
      { id: "1", date: mondayStr, durationMin: 30, completed: true },
      { id: "2", date: mondayStr, durationMin: 45, completed: true },
      { id: "3", date: tuesdayStr, durationMin: 60, completed: true },
    ];

    const weekly = getWeeklyFocus(sessions, now);
    expect(weekly.length).toBe(7);

    const mondayFocus = weekly.find((d) => d.day === "Mon");
    const tuesdayFocus = weekly.find((d) => d.day === "Tue");
    const wednesdayFocus = weekly.find((d) => d.day === "Wed");

    expect(mondayFocus?.minutes).toBe(75);
    expect(tuesdayFocus?.minutes).toBe(60);
    expect(wednesdayFocus?.minutes).toBe(0);
  });

  test("getWeeklyFocusTotal and getProductivityScore support pre-computed metrics", () => {
    const sessions: FocusSession[] = [
      { id: "1", date: format(weekStart, "yyyy-MM-dd'T'10:00:00'Z'"), durationMin: 120, completed: true },
    ];
    const tasks: Task[] = [
      { id: "t1", title: "Task 1", done: true, priority: "high", dueDate: format(now, "yyyy-MM-dd") },
      { id: "t2", title: "Task 2", done: false, priority: "low", dueDate: format(now, "yyyy-MM-dd") },
    ];
    const habits: Habit[] = [
      { id: "h1", title: "Habit 1", streak: 5, targetPerWeek: 7, history: [true, true, true, true, true] },
    ];

    const weekly = getWeeklyFocus(sessions, now);
    const totalMin = getWeeklyFocusTotal(sessions, now, weekly);
    expect(totalMin).toBe(120);

    const score = getProductivityScore(tasks, sessions, habits, now, {
      completionRate: 50,
      weeklyFocusTotal: 120,
      delayedCount: 0,
    });

    expect(score.score).toBeGreaterThan(0);
    expect(score.breakdown.completion).toBe(20); // 50% * 40 = 20
  });

  test("getWeeklyFocus operates efficiently with large datasets (14,000 sessions)", () => {
    // Generate 14,000 sessions evenly distributed across 14 calendar days
    const mockSessions: FocusSession[] = Array.from({ length: 14000 }, (_, i) => {
      const dayOffset = i % 14;
      const dateStr = format(addDays(weekStart, dayOffset), "yyyy-MM-dd'T'10:00:00'Z'");
      return {
        id: `s-${i}`,
        date: dateStr,
        durationMin: 10,
        completed: true,
      };
    });

    // Warm-up call
    getWeeklyFocus(mockSessions, now);

    const startTime = performance.now();
    const result = getWeeklyFocus(mockSessions, now);
    const endTime = performance.now();

    const durationMs = endTime - startTime;

    expect(result.length).toBe(7);
    // 14,000 sessions / 14 days = 1,000 sessions per day * 10 min = 10,000 min for each week day
    expect(result[0].minutes).toBe(10000);
    // Verified fast execution: single-pass iteration completes well under generous threshold
    expect(durationMs).toBeLessThan(200);
  }, 20000);
});
