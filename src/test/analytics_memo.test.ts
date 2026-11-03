import { describe, test, expect } from "vitest";
import {
  getWeeklyFocus,
  getWeeklyFocusTotal,
  getCompletionRate,
  getDelayedHighPriority,
  getProductivityScore,
  getNextBestAction,
} from "@/lib/analytics";
import type { Task, FocusSession, Habit } from "@/lib/types";

describe("Analytics memoization & pre-computation optimizations", () => {
  const mockNow = new Date("2025-01-15T12:00:00Z");

  const mockTasks: Task[] = Array.from({ length: 100 }, (_, i) => ({
    id: `task-${i}`,
    userId: "user-1",
    title: `Task ${i}`,
    priority: i % 3 === 0 ? "high" : i % 3 === 1 ? "med" : "low",
    done: i % 2 === 0,
    dueDate: i % 5 === 0 ? "2025-01-10" : "2025-01-15", // some overdue
    estimateMin: 25,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  }));

  const mockSessions: FocusSession[] = Array.from({ length: 250 }, (_, i) => ({
    id: `session-${i}`,
    userId: "user-1",
    taskId: `task-${i % 100}`,
    durationMin: 25,
    date: `2025-01-${String((i % 14) + 1).padStart(2, "0")}T10:00:00Z`,
    createdAt: "2025-01-01T00:00:00Z",
  }));

  const mockHabits: Habit[] = Array.from({ length: 5 }, (_, i) => ({
    id: `habit-${i}`,
    userId: "user-1",
    name: `Habit ${i}`,
    target: 7,
    streak: 5,
    history: [true, true, false, true, true, true, true],
    createdAt: "2025-01-01T00:00:00Z",
  }));

  test("pre-computed metrics produce identical results to default un-optimized path", () => {
    const weekly = getWeeklyFocus(mockSessions, mockNow);
    const totalMinOriginal = getWeeklyFocusTotal(mockSessions, mockNow);
    const totalMinOptimized = getWeeklyFocusTotal(weekly);

    expect(totalMinOptimized).toEqual(totalMinOriginal);

    const completion = getCompletionRate(mockTasks);
    const delayed = getDelayedHighPriority(mockTasks, mockNow);

    const scoreOriginal = getProductivityScore(
      mockTasks,
      mockSessions,
      mockHabits,
      mockNow
    );
    const scoreOptimized = getProductivityScore(
      mockTasks,
      mockSessions,
      mockHabits,
      mockNow,
      {
        completionRate: completion,
        weeklyFocusTotal: totalMinOptimized,
        delayedCount: delayed.count,
      }
    );

    expect(scoreOptimized).toEqual(scoreOriginal);

    const nextOriginal = getNextBestAction(mockTasks, mockNow);
    const nextOptimized = getNextBestAction(mockTasks, mockNow, delayed);

    expect(nextOptimized).toEqual(nextOriginal);
  });

  test(
    "pre-computation optimization achieves measurable speedup",
    () => {
      // Warm-up JIT
      getWeeklyFocus(mockSessions, mockNow);

      const runs = 50;

      // Unoptimized un-memoized path (like old Analytics.tsx)
      const t0 = performance.now();
      for (let i = 0; i < runs; i++) {
        const weekly = getWeeklyFocus(mockSessions, mockNow);
        const totalMin = getWeeklyFocusTotal(mockSessions, mockNow); // duplicate 1
        const completion = getCompletionRate(mockTasks);
        const delayed = getDelayedHighPriority(mockTasks, mockNow);
        const score = getProductivityScore(mockTasks, mockSessions, mockHabits, mockNow); // duplicate 2, 3, 4
        const next = getNextBestAction(mockTasks, mockNow); // duplicate 5
        void { weekly, totalMin, completion, delayed, score, next };
      }
      const tUnoptimized = performance.now() - t0;

      // Optimized single-pass memoized path (like new Analytics.tsx)
      const t1 = performance.now();
      for (let i = 0; i < runs; i++) {
        const weekly = getWeeklyFocus(mockSessions, mockNow);
        const totalMin = getWeeklyFocusTotal(weekly);
        const completion = getCompletionRate(mockTasks);
        const delayed = getDelayedHighPriority(mockTasks, mockNow);
        const score = getProductivityScore(mockTasks, mockSessions, mockHabits, mockNow, {
          completionRate: completion,
          weeklyFocusTotal: totalMin,
          delayedCount: delayed.count,
        });
        const next = getNextBestAction(mockTasks, mockNow, delayed);
        void { weekly, totalMin, completion, delayed, score, next };
      }
      const tOptimized = performance.now() - t1;

      // Log benchmark timing
      console.log(`Unoptimized: ${tUnoptimized.toFixed(2)}ms | Optimized: ${tOptimized.toFixed(2)}ms`);

      // The optimized single-pass approach should execute significantly faster
      expect(tOptimized).toBeLessThan(tUnoptimized);
    },
    20000
  );
});
