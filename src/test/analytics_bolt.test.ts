import { describe, it, expect } from "vitest";
import { getWeeklyFocus, getWeeklyFocusTotal } from "@/lib/analytics";
import type { FocusSession } from "@/lib/types";
import { startOfWeek, addDays, format, parseISO } from "date-fns";

describe("getWeeklyFocus optimization", () => {
  it("produces identical results to multi-pass baseline calculation", () => {
    const now = new Date("2025-05-14T12:00:00Z");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    const sessions: FocusSession[] = [
      {
        id: "1",
        date: format(weekStart, "yyyy-MM-dd'T'10:00:00"),
        durationMin: 45,
      },
      {
        id: "2",
        date: format(weekStart, "yyyy-MM-dd'T'15:00:00"),
        durationMin: 30,
      },
      {
        id: "3",
        date: format(addDays(weekStart, 2), "yyyy-MM-dd'T'09:00:00"),
        durationMin: 60,
      },
      {
        // Session from outside the week (previous month)
        id: "4",
        date: format(addDays(weekStart, -10), "yyyy-MM-dd'T'12:00:00"),
        durationMin: 50,
      },
    ];

    const result = getWeeklyFocus(sessions, now);
    expect(result).toHaveLength(7);
    expect(result[0].minutes).toBe(75); // Mon: 45 + 30
    expect(result[1].minutes).toBe(0); // Tue: 0
    expect(result[2].minutes).toBe(60); // Wed: 60
    expect(getWeeklyFocusTotal(sessions, now)).toBe(135);
  });

  it("benchmarks single-pass aggregation vs multi-pass filter", () => {
    const now = new Date("2025-05-14T12:00:00Z");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

    // Generate 14,000 sessions (multiple of 14)
    const sessions: FocusSession[] = [];
    for (let i = 0; i < 14000; i++) {
      const d = addDays(weekStart, i % 14);
      sessions.push({
        id: `s-${i}`,
        date: `${format(d, "yyyy-MM-dd")}T10:00:00`,
        durationMin: 25,
      });
    }

    // Warm-up target function to eliminate JIT overhead
    getWeeklyFocus(sessions, now);

    const startSinglePass = performance.now();
    const singlePassResult = getWeeklyFocus(sessions, now);
    const endSinglePass = performance.now();
    const singlePassDuration = endSinglePass - startSinglePass;

    // Baseline O(7N) implementation
    const baseline = (sList: FocusSession[]) => {
      return WEEK_LABELS.map((day, i) => {
        const date = addDays(weekStart, i);
        const dateKey = format(date, "yyyy-MM-dd");
        const minutes = sList
          .filter((s) => format(parseISO(s.date), "yyyy-MM-dd") === dateKey)
          .reduce((sum, s) => sum + s.durationMin, 0);
        return { day, date: dateKey, minutes };
      });
    };

    const startBaseline = performance.now();
    const baselineResult = baseline(sessions);
    const endBaseline = performance.now();
    const baselineDuration = endBaseline - startBaseline;

    expect(singlePassResult).toEqual(baselineResult);
    // Optimized single-pass should complete significantly faster than baseline multi-pass
    expect(singlePassDuration).toBeLessThan(baselineDuration);
    // Log measured benchmark stats
    console.log(
      `getWeeklyFocus benchmark: Baseline: ${baselineDuration.toFixed(2)}ms, SinglePass: ${singlePassDuration.toFixed(2)}ms, Speedup: ${(baselineDuration / singlePassDuration).toFixed(2)}x`
    );
  }, 20000);
});
