import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { addDays, startOfWeek, format } from "date-fns";

describe("getWeeklyFocus correctness and benchmark", () => {
  const baseDate = new Date("2025-05-14T10:00:00Z"); // Wednesday
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });

  it("calculates weekly focus accurately", () => {
    const mondayKey = format(weekStart, "yyyy-MM-dd");
    const tuesdayKey = format(addDays(weekStart, 1), "yyyy-MM-dd");

    const mockSessions: FocusSession[] = [
      { id: "1", date: `${mondayKey}T09:00:00`, durationMin: 25 },
      { id: "2", date: `${mondayKey}T14:00:00`, durationMin: 50 },
      { id: "3", date: `${tuesdayKey}T10:00:00`, durationMin: 30 },
      { id: "4", date: "2024-01-01T10:00:00", durationMin: 60 }, // Out of range session
    ];

    const result = getWeeklyFocus(mockSessions, baseDate);
    expect(result).toHaveLength(7);
    expect(result[0]).toEqual({ day: "Mon", date: mondayKey, minutes: 75 });
    expect(result[1]).toEqual({ day: "Tue", date: tuesdayKey, minutes: 30 });
    expect(result[2].minutes).toBe(0);
  });

  it("benchmarks performance with a large dataset", () => {
    // Generate 14,000 sessions distributed evenly across 14 days (multiple of 14)
    const sessions: FocusSession[] = [];
    for (let i = 0; i < 14000; i++) {
      const dayOffset = i % 14;
      const d = format(addDays(weekStart, dayOffset), "yyyy-MM-dd");
      sessions.push({
        id: `sess-${i}`,
        date: `${d}T10:00:00`,
        durationMin: 25,
      });
    }

    // Warm-up JIT
    getWeeklyFocus(sessions.slice(0, 500), baseDate);

    const start = performance.now();
    const runs = 10;
    for (let r = 0; r < runs; r++) {
      getWeeklyFocus(sessions, baseDate);
    }
    const elapsed = performance.now() - start;
    const avgMs = elapsed / runs;
    console.log(`[Benchmark] getWeeklyFocus execution time per call: ${avgMs.toFixed(2)}ms`);

    expect(avgMs).toBeGreaterThan(0);
  }, 20000);
});
