import { describe, expect, test } from "vitest";
import { Task } from "@/lib/types";

// Helper simulating unoptimized CalendarPage task lookups
function getTasksUnoptimized(tasks: Task[], days: string[], selectedKey: string) {
  const selectedTasks = tasks.filter((t) => t.dueDate === selectedKey);
  const daysTasks = days.map((dayKey) => tasks.filter((t) => t.dueDate === dayKey));
  return { selectedTasks, daysTasks };
}

// Helper simulating optimized CalendarPage task lookups using a Map
function getTasksOptimized(tasks: Task[], days: string[], selectedKey: string) {
  const tasksByDate = new Map<string, Task[]>();
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    if (t.dueDate) {
      const list = tasksByDate.get(t.dueDate);
      if (list) {
        list.push(t);
      } else {
        tasksByDate.set(t.dueDate, [t]);
      }
    }
  }
  const selectedTasks = tasksByDate.get(selectedKey) ?? [];
  const daysTasks = days.map((dayKey) => tasksByDate.get(dayKey) ?? []);
  return { selectedTasks, daysTasks };
}

describe("Calendar task lookups benchmark", () => {
  test("Map lookup yields correct results matching unoptimized filter", () => {
    const days = [
      "2025-01-01",
      "2025-01-02",
      "2025-01-03",
      "2025-01-04",
      "2025-01-05",
      "2025-01-06",
      "2025-01-07",
    ];
    const selectedKey = "2025-01-03";

    // Generate 14,000 mock tasks evenly distributed over dates
    const tasks: Task[] = Array.from({ length: 14000 }, (_, i) => ({
      id: `task-${i}`,
      title: `Task ${i}`,
      done: i % 2 === 0,
      priority: (i % 3 === 0 ? "high" : i % 3 === 1 ? "med" : "low") as "high" | "med" | "low",
      dueDate: days[i % 7],
      subtasks: [],
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    }));

    const unoptimized = getTasksUnoptimized(tasks, days, selectedKey);
    const optimized = getTasksOptimized(tasks, days, selectedKey);

    expect(optimized.selectedTasks.length).toBe(unoptimized.selectedTasks.length);
    expect(optimized.daysTasks.length).toBe(unoptimized.daysTasks.length);
    for (let i = 0; i < days.length; i++) {
      expect(optimized.daysTasks[i].length).toBe(unoptimized.daysTasks[i].length);
    }
  });

  test("Map lookup achieves significant execution speedup", () => {
    const days = [
      "2025-01-01",
      "2025-01-02",
      "2025-01-03",
      "2025-01-04",
      "2025-01-05",
      "2025-01-06",
      "2025-01-07",
    ];
    const selectedKey = "2025-01-03";

    const tasks: Task[] = Array.from({ length: 14000 }, (_, i) => ({
      id: `task-${i}`,
      title: `Task ${i}`,
      done: i % 2 === 0,
      priority: (i % 3 === 0 ? "high" : i % 3 === 1 ? "med" : "low") as "high" | "med" | "low",
      dueDate: days[i % 7],
      subtasks: [],
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    }));

    // Warm up JIT
    getTasksUnoptimized(tasks, days, selectedKey);
    getTasksOptimized(tasks, days, selectedKey);

    const iterations = 50;

    const startUnoptimized = performance.now();
    for (let i = 0; i < iterations; i++) {
      getTasksUnoptimized(tasks, days, selectedKey);
    }
    const endUnoptimized = performance.now();
    const durationUnoptimized = endUnoptimized - startUnoptimized;

    const startOptimized = performance.now();
    for (let i = 0; i < iterations; i++) {
      getTasksOptimized(tasks, days, selectedKey);
    }
    const endOptimized = performance.now();
    const durationOptimized = endOptimized - startOptimized;

    console.log(`Unoptimized (8N filters x ${iterations} runs): ${durationUnoptimized.toFixed(2)}ms`);
    console.log(`Optimized (Map setup x ${iterations} runs): ${durationOptimized.toFixed(2)}ms`);
    console.log(`Speedup factor: ${(durationUnoptimized / durationOptimized).toFixed(2)}x`);

    expect(durationOptimized).toBeLessThan(durationUnoptimized);
  }, 20000);
});
