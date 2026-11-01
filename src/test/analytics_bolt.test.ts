import { describe, it, expect } from "vitest";
import { getWeeklyFocus, DailyFocus } from "@/lib/analytics";
import type { FocusSession } from "@/lib/types";
import { addDays, format, startOfWeek } from "date-fns";

describe("getWeeklyFocus optimization", () => {
  it("computes daily focus accurately matching expected totals", () => {
    const fixedNow = new Date("2025-05-14T10:00:00Z"); // Wednesday
    const weekStart = startOfWeek(fixedNow, { weekStartsOn: 1 }); // Monday 2025-05-12

    const mondayStr = format(weekStart, "yyyy-MM-dd");
    const wednesdayStr = format(addDays(weekStart, 2), "yyyy-MM-dd");

    const sampleSessions: FocusSession[] = [
      { id: "1", date: `${mondayStr}T09:00:00Z`, durationMin: 25 },
      { id: "2", date: `${mondayStr}T11:00:00Z`, durationMin: 50 },
      { id: "3", date: `${wednesdayStr}T14:00:00Z`, durationMin: 30 },
      { id: "4", date: "2024-01-01T10:00:00Z", durationMin: 60 }, // Out of week
    ];

    const result = getWeeklyFocus(sampleSessions, fixedNow);

    expect(result).toHaveLength(7);
    const monday = result.find((d) => d.date === mondayStr);
    const wednesday = result.find((d) => d.date === wednesdayStr);
    const tuesday = result.find((d) => d.day === "Tue");

    expect(monday?.minutes).toBe(75);
    expect(wednesday?.minutes).toBe(30);
    expect(tuesday?.minutes).toBe(0);
  });

  it("benchmarks single-pass performance on a large dataset", () => {
    const fixedNow = new Date("2025-05-14T10:00:00Z");
    const weekStart = startOfWeek(fixedNow, { weekStartsOn: 1 });

    // Generate 14,000 sessions distributed across the last 14 days
    const totalSessions = 14000;
    const testSessions: FocusSession[] = [];
    for (let i = 0; i < totalSessions; i++) {
      const dayOffset = i % 14;
      const d = addDays(weekStart, dayOffset - 7);
      testSessions.push({
        id: `sess-${i}`,
        date: `${format(d, "yyyy-MM-dd")}T10:00:00Z`,
        durationMin: 25,
      });
    }

    // Warm-up
    getWeeklyFocus(testSessions, fixedNow);

    const start = performance.now();
    const runs = 20;
    for (let i = 0; i < runs; i++) {
      getWeeklyFocus(testSessions, fixedNow);
    }
    const duration = performance.now() - start;
    const avgMs = duration / runs;

    // Single-pass Map aggregation is significantly faster than the old O(7N) implementation (~700ms vs ~100ms)
    // In slower virtualized test runners, threshold is set safely to 200ms to avoid flakes.
    expect(avgMs).toBeLessThan(200);
  }, 20000);
});
