import { describe, test, expect } from "vitest";
import type { Task } from "../lib/types";

describe("Calendar Task Indexing Optimization Benchmark", () => {
  const generateMockTasks = (count: number): Task[] => {
    const dates = Array.from({ length: 30 }).map((_, i) => {
      const d = new Date(2025, 0, 1 + i);
      return d.toISOString().slice(0, 10);
    });

    return Array.from({ length: count }).map((_, i) => ({
      id: `task-${i}`,
      title: `Task ${i}`,
      dueDate: dates[i % dates.length],
      priority: (["high", "med", "low"] as const)[i % 3],
      done: i % 2 === 0,
    }));
  };

  test("Map indexing produces identical results to array filtering", () => {
    const tasks = generateMockTasks(1000);
    const sampleDates = ["2025-01-05", "2025-01-10", "2025-01-15", "2025-01-20"];

    // Unoptimized filtering per date
    const unoptimizedResults = sampleDates.map((date) =>
      tasks.filter((t) => t.dueDate === date)
    );

    // Optimized Map indexing
    const taskMap = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const list = taskMap.get(t.dueDate);
      if (list) {
        list.push(t);
      } else {
        taskMap.set(t.dueDate, [t]);
      }
    }
    const optimizedResults = sampleDates.map(
      (date) => taskMap.get(date) ?? []
    );

    expect(optimizedResults).toEqual(unoptimizedResults);
  });

  test("Map indexing is significantly faster than repeated O(N) filtering across 7 week days", () => {
    const tasks = generateMockTasks(5000);
    const weekKeys = [
      "2025-01-01",
      "2025-01-02",
      "2025-01-03",
      "2025-01-04",
      "2025-01-05",
      "2025-01-06",
      "2025-01-07",
      "2025-01-05", // selectedKey
    ];

    // Warmup
    tasks.filter((t) => t.dueDate === weekKeys[0]);

    // Measure Unoptimized (8x array filter) over 100 renders
    const startUnoptimized = performance.now();
    for (let render = 0; render < 100; render++) {
      for (const key of weekKeys) {
        tasks.filter((t) => t.dueDate === key);
      }
    }
    const durationUnoptimized = performance.now() - startUnoptimized;

    // Measure Optimized (Map build once per tasks change + 8x O(1) map get) over 100 renders
    const startOptimized = performance.now();
    // In React with useMemo, Map is built once when tasks reference changes
    const taskMap = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const list = taskMap.get(t.dueDate);
      if (list) {
        list.push(t);
      } else {
        taskMap.set(t.dueDate, [t]);
      }
    }
    for (let render = 0; render < 100; render++) {
      for (const key of weekKeys) {
        taskMap.get(key);
      }
    }
    const durationOptimized = performance.now() - startOptimized;

    console.log(
      `Unoptimized: ${durationUnoptimized.toFixed(2)}ms | Optimized: ${durationOptimized.toFixed(2)}ms`
    );

    expect(durationOptimized).toBeLessThan(durationUnoptimized);
  });
});
