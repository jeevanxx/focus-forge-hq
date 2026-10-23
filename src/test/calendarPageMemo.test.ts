import { describe, it, expect } from "vitest";
import type { Task } from "@/lib/types";

const buildTasksByDate = (tasks: Task[]): Map<string, Task[]> => {
  const map = new Map<string, Task[]>();
  for (const task of tasks) {
    const existing = map.get(task.dueDate);
    if (existing) {
      existing.push(task);
    } else {
      map.set(task.dueDate, [task]);
    }
  }
  return map;
};

describe("CalendarPage task indexing benchmark & correctness", () => {
  it("correctly groups tasks by dueDate", () => {
    const tasks: Task[] = [
      { id: "1", title: "T1", dueDate: "2025-03-01", done: false, priority: "high", createdAt: "2025-01-01", subtasks: [] },
      { id: "2", title: "T2", dueDate: "2025-03-01", done: true, priority: "med", createdAt: "2025-01-01", subtasks: [] },
      { id: "3", title: "T3", dueDate: "2025-03-02", done: false, priority: "low", createdAt: "2025-01-01", subtasks: [] },
    ];

    const map = buildTasksByDate(tasks);
    expect(map.get("2025-03-01")?.length).toBe(2);
    expect(map.get("2025-03-02")?.length).toBe(1);
    expect(map.get("2025-03-03")).toBeUndefined();
  });

  it("benchmarks Map indexing vs repeated array filtering across week days", () => {
    const dates = Array.from({ length: 7 }, (_, i) => `2025-03-0${i + 1}`);
    const tasks: Task[] = Array.from({ length: 7000 }, (_, i) => ({
      id: `task-${i}`,
      title: `Task ${i}`,
      dueDate: dates[i % 7],
      done: i % 2 === 0,
      priority: "med",
      createdAt: "2025-01-01",
      subtasks: [],
    }));

    // Warm-up calls
    buildTasksByDate(tasks);
    dates.forEach((d) => tasks.filter((t) => t.dueDate === d));

    // 1. Repeated O(N) array filtering (7 * N)
    const startFilter = performance.now();
    for (let run = 0; run < 100; run++) {
      for (const d of dates) {
        tasks.filter((t) => t.dueDate === d);
      }
    }
    const durationFilter = performance.now() - startFilter;

    // 2. Map indexing (O(N) single-pass + 7 O(1) lookups)
    const startMap = performance.now();
    for (let run = 0; run < 100; run++) {
      const map = buildTasksByDate(tasks);
      for (const d of dates) {
        map.get(d);
      }
    }
    const durationMap = performance.now() - startMap;

    // Map indexing should be significantly faster than repeated array filtering
    expect(durationMap).toBeLessThan(durationFilter);
  });
});
