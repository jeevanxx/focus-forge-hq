import { describe, it, expect } from "vitest";
import {
  getWeeklyFocus,
  getProductivityScore,
  getNextBestAction,
  getCompletionRate,
  getDelayedHighPriority,
  getWeeklyFocusTotal,
} from "@/lib/analytics";
import type { FocusSession, Task, Habit } from "@/lib/types";

describe("Analytics Bolt Optimizations", () => {
  const now = new Date("2025-01-15T12:00:00Z");

  const mockSessions: FocusSession[] = [
    { id: "1", durationMin: 25, date: "2025-01-13T10:00:00Z", taskId: "t1" },
    { id: "2", durationMin: 50, date: "2025-01-13T14:00:00Z", taskId: "t2" },
    { id: "3", durationMin: 30, date: "2025-01-14T09:00:00Z", taskId: "t1" },
  ];

  const mockTasks: Task[] = [
    { id: "t1", title: "Task 1", done: true, priority: "high", dueDate: "2025-01-13" },
    { id: "t2", title: "Task 2", done: false, priority: "high", dueDate: "2025-01-10" },
    { id: "t3", title: "Task 3", done: false, priority: "low", dueDate: "2025-01-15" },
  ];

  const mockHabits: Habit[] = [
    { id: "h1", name: "Exercise", streak: 5, target: 7, history: [true, true, true, true, true] },
  ];

  it("calculates weekly focus correctly with single-pass O(N) iteration", () => {
    const weekly = getWeeklyFocus(mockSessions, now);
    expect(weekly).toHaveLength(7);
    const mon = weekly.find((d) => d.day === "Mon");
    const tue = weekly.find((d) => d.day === "Tue");
    expect(mon?.minutes).toBe(75);
    expect(tue?.minutes).toBe(30);
  });

  it("produces identical productivity score when using precomputed metrics", () => {
    const scoreWithoutPrecomputed = getProductivityScore(mockTasks, mockSessions, mockHabits, now);

    const completion = getCompletionRate(mockTasks);
    const weeklyTotal = getWeeklyFocusTotal(mockSessions, now);
    const delayed = getDelayedHighPriority(mockTasks, now);

    const scoreWithPrecomputed = getProductivityScore(mockTasks, mockSessions, mockHabits, now, {
      completionRate: completion,
      weeklyFocusTotal: weeklyTotal,
      delayedCount: delayed.count,
    });

    expect(scoreWithPrecomputed).toEqual(scoreWithoutPrecomputed);
  });

  it("produces identical next best action when using precomputed delayed report", () => {
    const delayedReport = getDelayedHighPriority(mockTasks, now);

    const next1 = getNextBestAction(mockTasks, now);
    const next2 = getNextBestAction(mockTasks, now, delayedReport);

    expect(next2).toEqual(next1);
  });

  it("benchmarks getWeeklyFocus single-pass performance under high load", () => {
    // Generate 2,800 sessions (a multiple of 14 for even distribution)
    const largeSessions: FocusSession[] = [];
    for (let i = 0; i < 2800; i++) {
      const dayOffset = i % 14;
      const date = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000).toISOString();
      largeSessions.push({
        id: `s_${i}`,
        durationMin: 25,
        date,
      });
    }

    // Warm-up call to avoid JIT overhead
    getWeeklyFocus(largeSessions, now);

    const start = performance.now();
    for (let run = 0; run < 10; run++) {
      getWeeklyFocus(largeSessions, now);
    }
    const duration = performance.now() - start;

    // 10 runs of 2,800 items should complete well within 500ms with O(N) single pass
    expect(duration).toBeLessThan(500);
  }, 20000);
});
