import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "@/lib/analytics";
import type { FocusSession } from "@/lib/types";
import { addDays, format, parseISO, startOfWeek } from "date-fns";

const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

// Baseline implementation representing prior O(7N) algorithm
const baselineGetWeeklyFocus = (
  sessions: FocusSession[],
  now: Date = new Date()
) => {
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  return WEEK_LABELS.map((day, i) => {
    const date = addDays(weekStart, i);
    const dateKey = format(date, "yyyy-MM-dd");
    const minutes = sessions
      .filter((s) => format(parseISO(s.date), "yyyy-MM-dd") === dateKey)
      .reduce((sum, s) => sum + s.durationMin, 0);
    return { day, date: dateKey, minutes };
  });
};

describe("getWeeklyFocus Optimization Benchmark & Correctness", () => {
  it("produces identical results to the baseline implementation", () => {
    const refDate = new Date("2026-03-24T12:00:00.000Z");
    const weekStart = startOfWeek(refDate, { weekStartsOn: 1 });

    const sampleSessions: FocusSession[] = [
      { id: "1", date: format(weekStart, "yyyy-MM-dd'T'10:00:00"), durationMin: 25 },
      { id: "2", date: format(weekStart, "yyyy-MM-dd'T'14:00:00"), durationMin: 50 },
      { id: "3", date: format(addDays(weekStart, 2), "yyyy-MM-dd'T'09:00:00"), durationMin: 45 },
      { id: "4", date: format(addDays(weekStart, 6), "yyyy-MM-dd'T'18:00:00"), durationMin: 60 },
      // Out-of-week session
      { id: "5", date: format(addDays(weekStart, 10), "yyyy-MM-dd'T'12:00:00"), durationMin: 30 },
    ];

    const baselineResult = baselineGetWeeklyFocus(sampleSessions, refDate);
    const optimizedResult = getWeeklyFocus(sampleSessions, refDate);

    expect(optimizedResult).toEqual(baselineResult);
  });

  it(
    "demonstrates relative speedup over O(7N) baseline on large session lists",
    () => {
      const refDate = new Date("2026-03-24T12:00:00.000Z");
      const weekStart = startOfWeek(refDate, { weekStartsOn: 1 });

      // Generate 14,000 sessions (multiple of 14 for even distribution)
      const totalSessions = 14000;
      const sessions: FocusSession[] = Array.from({ length: totalSessions }, (_, i) => ({
        id: `s-${i}`,
        date: format(addDays(weekStart, (i % 14) - 3), "yyyy-MM-dd'T'10:00:00"),
        durationMin: 25,
      }));

      // Warm up JIT
      baselineGetWeeklyFocus(sessions, refDate);
      getWeeklyFocus(sessions, refDate);

      // Measure baseline
      const t0 = performance.now();
      const baselineRes = baselineGetWeeklyFocus(sessions, refDate);
      const baselineDuration = performance.now() - t0;

      // Measure optimized
      const t1 = performance.now();
      const optimizedRes = getWeeklyFocus(sessions, refDate);
      const optimizedDuration = performance.now() - t1;

      expect(optimizedRes).toEqual(baselineRes);
      expect(optimizedDuration).toBeLessThan(baselineDuration);
    },
    20000
  );
});
