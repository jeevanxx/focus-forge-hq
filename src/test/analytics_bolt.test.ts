import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "@/lib/analytics";
import type { FocusSession } from "@/lib/types";
import { addDays, format, startOfWeek } from "date-fns";

describe("getWeeklyFocus benchmark & verification", () => {
  it("correctly aggregates focus session minutes", () => {
    const fixedNow = new Date("2025-05-14T10:00:00Z"); // Wednesday
    const weekStart = startOfWeek(fixedNow, { weekStartsOn: 1 });
    const mon = format(weekStart, "yyyy-MM-dd");
    const wed = format(addDays(weekStart, 2), "yyyy-MM-dd");

    const sampleSessions: FocusSession[] = [
      { id: "1", date: `${mon}T09:00:00Z`, durationMin: 25 },
      { id: "2", date: `${mon}T14:00:00Z`, durationMin: 50 },
      { id: "3", date: `${wed}T10:00:00Z`, durationMin: 30 },
      { id: "4", date: "2024-01-01T10:00:00Z", durationMin: 60 }, // outside current week
    ];

    const result = getWeeklyFocus(sampleSessions, fixedNow);
    expect(result).toHaveLength(7);
    expect(result.find((d) => d.day === "Mon")?.minutes).toBe(75);
    expect(result.find((d) => d.day === "Tue")?.minutes).toBe(0);
    expect(result.find((d) => d.day === "Wed")?.minutes).toBe(30);
    expect(result.find((d) => d.day === "Sun")?.minutes).toBe(0);
  });

  it("measures performance on large datasets", () => {
    const fixedNow = new Date("2025-05-14T10:00:00Z");
    const weekStart = startOfWeek(fixedNow, { weekStartsOn: 1 });

    // Generate 14,000 sessions (multiple of 14) spread across two weeks
    const dataset: FocusSession[] = [];
    for (let i = 0; i < 14000; i++) {
      const dayOffset = i % 14; // 0..13 days from weekStart
      const sessionDate = addDays(weekStart, dayOffset);
      dataset.push({
        id: `sess-${i}`,
        date: `${format(sessionDate, "yyyy-MM-dd")}T10:00:00Z`,
        durationMin: 25,
      });
    }

    // Warm-up
    getWeeklyFocus(dataset.slice(0, 100), fixedNow);

    const start = performance.now();
    const runs = 10;
    for (let r = 0; r < runs; r++) {
      getWeeklyFocus(dataset, fixedNow);
    }
    const totalTimeMs = performance.now() - start;
    const avgTimeMs = totalTimeMs / runs;

    console.log(`[Bolt Benchmark] getWeeklyFocus avg execution time: ${avgTimeMs.toFixed(2)}ms for 14,000 items`);
    expect(avgTimeMs).toBeGreaterThan(0);
  }, 20000);
});
