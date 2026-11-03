import { describe, it, expect } from "vitest";
import {
  getWeeklyFocus,
  getWeeklyFocusTotal,
  getProductivityScore,
  getCompletionRate,
  getDelayedHighPriority,
} from "../lib/analytics";
import type { FocusSession, Task, Habit } from "../lib/types";
import { format, addDays, startOfWeek } from "date-fns";

describe("Bolt Performance Optimization: analytics.ts", () => {
  const mockNow = new Date("2025-02-17T12:00:00Z"); // Monday

  it("getWeeklyFocus correctly buckets sessions by day in current week", () => {
    const weekStart = startOfWeek(mockNow, { weekStartsOn: 1 });
    const monDate = format(weekStart, "yyyy-MM-dd");
    const wedDate = format(addDays(weekStart, 2), "yyyy-MM-dd");

    const sessions: FocusSession[] = [
      { id: "1", date: `${monDate}T09:00:00Z`, durationMin: 45 },
      { id: "2", date: `${monDate}T14:00:00Z`, durationMin: 30 },
      { id: "3", date: `${wedDate}T10:00:00Z`, durationMin: 60 },
      // Session outside current week
      { id: "4", date: "2024-01-01T10:00:00Z", durationMin: 120 },
    ];

    const result = getWeeklyFocus(sessions, mockNow);

    expect(result).toHaveLength(7);
    expect(result[0]).toEqual({ day: "Mon", date: monDate, minutes: 75 });
    expect(result[2]).toEqual({ day: "Wed", date: wedDate, minutes: 60 });
    expect(result[1].minutes).toBe(0);
  });

  it("getWeeklyFocusTotal works with and without precomputed dailyFocus", () => {
    const weekStart = startOfWeek(mockNow, { weekStartsOn: 1 });
    const monDate = format(weekStart, "yyyy-MM-dd");
    const sessions: FocusSession[] = [
      { id: "1", date: `${monDate}T09:00:00Z`, durationMin: 50 },
    ];

    const weekly = getWeeklyFocus(sessions, mockNow);
    const totalWithPrecomputed = getWeeklyFocusTotal(sessions, mockNow, weekly);
    const totalWithoutPrecomputed = getWeeklyFocusTotal(sessions, mockNow);

    expect(totalWithPrecomputed).toBe(50);
    expect(totalWithoutPrecomputed).toBe(50);
  });

  it("getProductivityScore returns identical score with precomputed metrics", () => {
    const tasks: Task[] = [
      { id: "t1", title: "Task 1", done: true, priority: "high", dueDate: "2025-02-17" },
      { id: "t2", title: "Task 2", done: false, priority: "low", dueDate: "2025-02-18" },
    ];
    const sessions: FocusSession[] = [
      { id: "s1", date: "2025-02-17T10:00:00Z", durationMin: 120 },
    ];
    const habits: Habit[] = [
      { id: "h1", name: "Read", emoji: "📚", streak: 3, target: 5, history: [true, true, true], color: "ember" },
    ];

    const scoreDefault = getProductivityScore(tasks, sessions, habits, mockNow);

    const completion = getCompletionRate(tasks);
    const weeklyFocus = getWeeklyFocusTotal(sessions, mockNow);
    const delayed = getDelayedHighPriority(tasks, mockNow).count;

    const scorePrecomputed = getProductivityScore(tasks, sessions, habits, mockNow, {
      completionRate: completion,
      weeklyFocusTotal: weeklyFocus,
      delayedCount: delayed,
    });

    expect(scorePrecomputed).toEqual(scoreDefault);
  });

  it("benchmarks getWeeklyFocus single-pass performance with 14,000 sessions", () => {
    const weekStart = startOfWeek(mockNow, { weekStartsOn: 1 });
    // Generate 14,000 focus sessions distributed across 14 days
    const totalSessions = 14000;
    const largeSessions: FocusSession[] = [];
    for (let i = 0; i < totalSessions; i++) {
      const dayOffset = i % 14;
      const d = format(addDays(weekStart, dayOffset), "yyyy-MM-dd");
      largeSessions.push({
        id: `session-${i}`,
        date: `${d}T10:00:00Z`,
        durationMin: 25,
      });
    }

    // Warmup
    getWeeklyFocus(largeSessions, mockNow);

    const start = performance.now();
    const runs = 20;
    for (let r = 0; r < runs; r++) {
      getWeeklyFocus(largeSessions, mockNow);
    }
    const duration = (performance.now() - start) / runs;

    const res = getWeeklyFocus(largeSessions, mockNow);
    // 1,000 sessions per day for 7 days in week = 25,000 minutes per day
    expect(res[0].minutes).toBe(25000);

    // Single-pass O(N) execution should easily take < 200ms per run even on slow runners
    expect(duration).toBeLessThan(200);
  });
});
