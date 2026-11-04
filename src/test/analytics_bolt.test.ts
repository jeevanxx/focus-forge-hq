import { describe, it, expect } from "vitest";
import { getWeeklyFocus, getWeeklyFocusTotal } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { addDays, format, startOfWeek } from "date-fns";

describe("getWeeklyFocus correctness & performance", () => {
  const baseDate = new Date("2025-05-14T10:00:00Z"); // Wednesday
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 }); // Monday 2025-05-12

  it("handles empty sessions array correctly", () => {
    const result = getWeeklyFocus([], baseDate);
    expect(result).toHaveLength(7);
    expect(result.reduce((sum, d) => sum + d.minutes, 0)).toBe(0);
    expect(getWeeklyFocusTotal([], baseDate)).toBe(0);
  });

  it("correctly buckets sessions to respective days of the week", () => {
    const mondayKey = format(weekStart, "yyyy-MM-dd");
    const tuesdayKey = format(addDays(weekStart, 1), "yyyy-MM-dd");
    const sundayKey = format(addDays(weekStart, 6), "yyyy-MM-dd");

    const sessions: FocusSession[] = [
      { id: "1", userId: "u1", date: `${mondayKey}T09:00:00`, durationMin: 25 },
      { id: "2", userId: "u1", date: `${mondayKey}T14:00:00`, durationMin: 50 },
      { id: "3", userId: "u1", date: `${tuesdayKey}T10:00:00`, durationMin: 45 },
      { id: "4", userId: "u1", date: `${sundayKey}T20:00:00`, durationMin: 30 },
      // Out of week bounds
      { id: "5", userId: "u1", date: "2024-01-01T10:00:00", durationMin: 60 },
    ];

    const result = getWeeklyFocus(sessions, baseDate);
    expect(result[0].day).toBe("Mon");
    expect(result[0].minutes).toBe(75);
    expect(result[1].day).toBe("Tue");
    expect(result[1].minutes).toBe(45);
    expect(result[2].day).toBe("Wed");
    expect(result[2].minutes).toBe(0);
    expect(result[6].day).toBe("Sun");
    expect(result[6].minutes).toBe(30);

    expect(getWeeklyFocusTotal(sessions, baseDate)).toBe(150);
  });

  it("benchmarks performance on large datasets", () => {
    // Generate 14,000 sessions (multiple of 14 for even distribution)
    const sessions: FocusSession[] = [];
    for (let i = 0; i < 14000; i++) {
      const dayOffset = i % 14; // across current week and surrounding days
      const d = addDays(weekStart, dayOffset);
      sessions.push({
        id: `sess-${i}`,
        userId: "user-1",
        date: `${format(d, "yyyy-MM-dd")}T10:00:00`,
        durationMin: 25,
      });
    }

    // Warm up
    getWeeklyFocus(sessions, baseDate);

    const start = performance.now();
    const runs = 10;
    for (let r = 0; r < runs; r++) {
      getWeeklyFocus(sessions, baseDate);
    }
    const elapsed = performance.now() - start;
    const avgMs = elapsed / runs;

    console.log(`[Bolt Benchmark] getWeeklyFocus average execution time over ${runs} runs: ${avgMs.toFixed(2)}ms`);
    // Threshold verifying high execution time before optimization (~900ms) and ensuring test finishes reliably
    expect(avgMs).toBeLessThan(2000);
  }, 30000);
});
