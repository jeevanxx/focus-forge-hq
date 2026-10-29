import { describe, test, expect } from "vitest";
import type { Task } from "@/lib/types";

describe("Calendar task indexing optimization", () => {
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(2025, 0, 1 + i);
    return d.toISOString().slice(0, 10);
  });

  // Generate 14,000 tasks distributed across 14 dates
  const sampleTasks: Task[] = Array.from({ length: 14000 }, (_, i) => ({
    id: `task-${i}`,
    title: `Task ${i}`,
    priority: i % 3 === 0 ? "high" : i % 3 === 1 ? "med" : "low",
    done: i % 2 === 0,
    dueDate: dates[i % 14],
  }));

  const weekDates = dates.slice(0, 7);

  test("Map-based indexing produces identical task sets as repeated array filtering", () => {
    // Unoptimized approach: repeated filtering
    const unoptimizedResult = weekDates.map((date) =>
      sampleTasks.filter((t) => t.dueDate === date)
    );

    // Optimized approach: Map indexing
    const map = new Map<string, Task[]>();
    for (let i = 0; i < sampleTasks.length; i++) {
      const t = sampleTasks[i];
      if (t.dueDate) {
        const list = map.get(t.dueDate);
        if (list) {
          list.push(t);
        } else {
          map.set(t.dueDate, [t]);
        }
      }
    }
    const optimizedResult = weekDates.map((date) => map.get(date) ?? []);

    expect(optimizedResult.length).toBe(unoptimizedResult.length);
    for (let i = 0; i < weekDates.length; i++) {
      expect(optimizedResult[i]).toEqual(unoptimizedResult[i]);
    }
  });

  test("Map-based indexing is measurably faster than repeated array filtering", () => {
    // Warmup JIT
    for (let i = 0; i < sampleTasks.length; i++) {
      const t = sampleTasks[i];
    }

    // Measure Unoptimized (7 x O(N) filters)
    const t0 = performance.now();
    for (let run = 0; run < 20; run++) {
      const _ = weekDates.map((date) => sampleTasks.filter((t) => t.dueDate === date));
    }
    const unoptimizedTime = performance.now() - t0;

    // Measure Optimized (1 x O(N) map construction + 7 x O(1) lookups)
    const t1 = performance.now();
    for (let run = 0; run < 20; run++) {
      const map = new Map<string, Task[]>();
      for (let i = 0; i < sampleTasks.length; i++) {
        const t = sampleTasks[i];
        if (t.dueDate) {
          const list = map.get(t.dueDate);
          if (list) {
            list.push(t);
          } else {
            map.set(t.dueDate, [t]);
          }
        }
      }
      const _ = weekDates.map((date) => map.get(date) ?? []);
    }
    const optimizedTime = performance.now() - t1;

    console.log(`Unoptimized (20 runs): ${unoptimizedTime.toFixed(2)}ms`);
    console.log(`Optimized (20 runs): ${optimizedTime.toFixed(2)}ms`);

    expect(optimizedTime).toBeLessThan(unoptimizedTime);
  });
});
