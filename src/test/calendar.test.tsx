import { describe, test, expect } from "vitest";
import type { Task } from "@/lib/types";

// Helper for single-pass indexing (same logic used in CalendarPage)
function indexTasksByDate(tasks: Task[]): Map<string, Task[]> {
  const map = new Map<string, Task[]>();
  for (const t of tasks) {
    if (!t.dueDate) continue;
    const existing = map.get(t.dueDate);
    if (existing) {
      existing.push(t);
    } else {
      map.set(t.dueDate, [t]);
    }
  }
  return map;
}

// Naive lookup (original approach)
function naiveTaskLookups(tasks: Task[], dates: string[]): Task[][] {
  return dates.map((dateKey) => tasks.filter((t) => t.dueDate === dateKey));
}

// Optimized lookup (Map-indexed approach)
function optimizedTaskLookups(tasksByDate: Map<string, Task[]>, dates: string[]): Task[][] {
  return dates.map((dateKey) => tasksByDate.get(dateKey) ?? []);
}

describe("Calendar task lookup & workload optimization", () => {
  test("correctly indexes tasks and resolves lookups by date", () => {
    const mockTasks: Task[] = [
      { id: "1", title: "Task 1", dueDate: "2025-05-10", priority: "high", done: false, user_id: "u1", created_at: "", estimateMin: 30 },
      { id: "2", title: "Task 2", dueDate: "2025-05-10", priority: "med", done: true, user_id: "u1", created_at: "", estimateMin: 45 },
      { id: "3", title: "Task 3", dueDate: "2025-05-11", priority: "low", done: false, user_id: "u1", created_at: "", estimateMin: 60 },
      { id: "4", title: "Task 4", dueDate: "", priority: "low", done: false, user_id: "u1", created_at: "" },
    ];

    const indexed = indexTasksByDate(mockTasks);

    expect(indexed.get("2025-05-10")).toHaveLength(2);
    expect(indexed.get("2025-05-11")).toHaveLength(1);
    expect(indexed.get("2025-05-12")).toBeUndefined();

    const openFor10 = (indexed.get("2025-05-10") ?? []).filter((t) => !t.done);
    expect(openFor10).toHaveLength(1);
    expect(openFor10[0].id).toBe("1");
  });

  test("benchmark single-pass Map indexing vs naive repeated filtering", () => {
    const dates = Array.from({ length: 14 }, (_, i) => `2025-05-${String(i + 1).padStart(2, "0")}`);
    const taskCount = 14000;
    const mockTasks: Task[] = Array.from({ length: taskCount }, (_, i) => ({
      id: `task-${i}`,
      title: `Task ${i}`,
      dueDate: dates[i % dates.length],
      priority: i % 3 === 0 ? "high" : i % 3 === 1 ? "med" : "low",
      done: i % 2 === 0,
      user_id: "user-1",
      created_at: new Date().toISOString(),
      estimateMin: 25,
    }));

    // Selected week (7 dates to query on render)
    const weekDates = dates.slice(0, 7);

    // Warm-up JIT
    naiveTaskLookups(mockTasks, weekDates);
    const warmupMap = indexTasksByDate(mockTasks);
    optimizedTaskLookups(warmupMap, weekDates);

    // Measure Naive Approach (8 lookups over entire dataset per simulated render)
    const naiveStart = performance.now();
    for (let render = 0; render < 20; render++) {
      naiveTaskLookups(mockTasks, weekDates);
    }
    const naiveTime = performance.now() - naiveStart;

    // Measure Optimized Approach
    const optStart = performance.now();
    for (let render = 0; render < 20; render++) {
      const indexedMap = indexTasksByDate(mockTasks);
      optimizedTaskLookups(indexedMap, weekDates);
    }
    const optTime = performance.now() - optStart;

    // Verify both produce identical results
    const naiveResult = naiveTaskLookups(mockTasks, weekDates);
    const optMap = indexTasksByDate(mockTasks);
    const optResult = optimizedTaskLookups(optMap, weekDates);

    expect(optResult).toEqual(naiveResult);
    expect(optTime).toBeLessThan(naiveTime);
  }, 20000);
});
