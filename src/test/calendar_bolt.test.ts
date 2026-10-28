import { describe, test, expect } from "vitest";
import type { Task } from "../lib/types";

describe("Calendar task grouping performance and correctness", () => {
  const dates = ["2025-03-01", "2025-03-02", "2025-03-03", "2025-03-04", "2025-03-05", "2025-03-06", "2025-03-07"];

  // Helper function replicating the old O(7N + N) repeated array filtering approach
  const oldGroupingApproach = (tasks: Task[], days: string[]) => {
    const results: Record<string, Task[]> = {};
    for (const key of days) {
      results[key] = tasks.filter((t) => t.dueDate === key);
    }
    return results;
  };

  // Helper function replicating the optimized Map-based O(N) single-pass approach
  const newGroupingApproach = (tasks: Task[], days: string[]) => {
    const map = new Map<string, Task[]>();
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      if (!task.dueDate) continue;
      const list = map.get(task.dueDate);
      if (list) {
        list.push(task);
      } else {
        map.set(task.dueDate, [task]);
      }
    }
    const results: Record<string, Task[]> = {};
    for (const key of days) {
      results[key] = map.get(key) ?? [];
    }
    return results;
  };

  test("Map-based grouping produces identical result to array filtering", () => {
    const sampleTasks: Task[] = [
      { id: "1", title: "Task 1", dueDate: "2025-03-01", priority: "high", done: false, user_id: "u1", created_at: "" },
      { id: "2", title: "Task 2", dueDate: "2025-03-01", priority: "med", done: true, user_id: "u1", created_at: "" },
      { id: "3", title: "Task 3", dueDate: "2025-03-03", priority: "low", done: false, user_id: "u1", created_at: "" },
    ];

    const oldResult = oldGroupingApproach(sampleTasks, dates);
    const newResult = newGroupingApproach(sampleTasks, dates);

    expect(newResult).toEqual(oldResult);
  });

  test("Map-based grouping is measurably faster than repeated array filtering on large task lists", () => {
    // Generate 5,000 tasks distributed across various dates
    const benchmarkTasks: Task[] = Array.from({ length: 5000 }, (_, i) => ({
      id: `task-${i}`,
      title: `Task ${i}`,
      dueDate: dates[i % dates.length],
      priority: i % 2 === 0 ? "high" : "low",
      done: i % 3 === 0,
      user_id: "user-1",
      created_at: new Date().toISOString(),
    }));

    // Warm up JIT
    oldGroupingApproach(benchmarkTasks, dates);
    newGroupingApproach(benchmarkTasks, dates);

    const runs = 20;

    const startOld = performance.now();
    for (let r = 0; r < runs; r++) {
      oldGroupingApproach(benchmarkTasks, dates);
    }
    const durationOld = performance.now() - startOld;

    const startNew = performance.now();
    for (let r = 0; r < runs; r++) {
      newGroupingApproach(benchmarkTasks, dates);
    }
    const durationNew = performance.now() - startNew;

    // Verify Map-based single pass execution time is faster
    expect(durationNew).toBeLessThan(durationOld);
  }, 20000);
});
