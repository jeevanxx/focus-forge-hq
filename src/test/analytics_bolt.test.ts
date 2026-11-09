import { describe, it, expect } from "vitest";
import { addDays, startOfWeek, format, parseISO } from "date-fns";
import { getWeeklyFocus } from "@/lib/analytics";
import type { FocusSession } from "@/lib/types";

// Baseline implementation representing previous O(7N) nested filtering
const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const baselineGetWeeklyFocus = (sessions: FocusSession[], now: Date = new Date()) => {
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

describe("getWeeklyFocus performance & correctness", () => {
  it("correctly calculates weekly focus across boundary days", () => {
    const now = new Date("2025-05-14T12:00:00Z");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const sessions: FocusSession[] = [
      { id: "1", date: format(weekStart, "yyyy-MM-dd'T'10:00:00"), durationMin: 45 },
      { id: "2", date: format(weekStart, "yyyy-MM-dd'T'14:00:00"), durationMin: 30 },
      { id: "3", date: format(addDays(weekStart, 2), "yyyy-MM-dd'T'09:00:00"), durationMin: 60 },
      { id: "4", date: format(addDays(weekStart, 6), "yyyy-MM-dd'T'18:00:00"), durationMin: 20 },
      // Outside of this week:
      { id: "5", date: format(addDays(weekStart, -1), "yyyy-MM-dd'T'18:00:00"), durationMin: 50 },
      { id: "6", date: format(addDays(weekStart, 7), "yyyy-MM-dd'T'18:00:00"), durationMin: 50 },
    ];

    const result = getWeeklyFocus(sessions, now);
    const baseline = baselineGetWeeklyFocus(sessions, now);

    expect(result).toEqual(baseline);
    expect(result[0].minutes).toBe(75); // Mon
    expect(result[2].minutes).toBe(60); // Wed
    expect(result[6].minutes).toBe(20); // Sun
    expect(result[1].minutes).toBe(0);  // Tue
  });

  it("handles empty sessions array correctly", () => {
    const now = new Date("2025-05-14T12:00:00Z");
    const result = getWeeklyFocus([], now);
    expect(result).toHaveLength(7);
    expect(result.every((d) => d.minutes === 0)).toBe(true);
  });

  it("matches baseline and runs significantly faster with large datasets", () => {
    const now = new Date("2025-05-14T12:00:00Z");
    const sessions: FocusSession[] = [];
    const base = new Date("2025-05-14T12:00:00Z");

    // 14,000 sessions distributed across 14 calendar days (multiple of 14)
    for (let i = 0; i < 14000; i++) {
      sessions.push({
        id: `s-${i}`,
        date: new Date(base.getTime() - (i % 14) * 86400000).toISOString(),
        durationMin: 25,
      });
    }

    // Warm-up to eliminate JIT compilation bias
    baselineGetWeeklyFocus(sessions, now);
    getWeeklyFocus(sessions, now);

    const t0 = performance.now();
    const baselineResult = baselineGetWeeklyFocus(sessions, now);
    const baselineDuration = performance.now() - t0;

    const t1 = performance.now();
    const optimizedResult = getWeeklyFocus(sessions, now);
    const optimizedDuration = performance.now() - t1;

    expect(optimizedResult).toEqual(baselineResult);
    expect(optimizedDuration).toBeLessThan(baselineDuration);
  }, 20000);
});
