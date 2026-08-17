import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "@/lib/analytics";
import type { FocusSession } from "@/lib/types";
import { format, startOfWeek, addDays, subDays } from "date-fns";

describe("analytics - getWeeklyFocus", () => {
  it("returns zero focus minutes for all 7 days when sessions array is empty", () => {
    const now = new Date("2025-03-10T12:00:00Z"); // A Monday
    const result = getWeeklyFocus([], now);

    expect(result).toHaveLength(7);
    expect(result.map((d) => d.day)).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    expect(result.every((d) => d.minutes === 0)).toBe(true);
  });

  it("correctly aggregates focus minutes for sessions in the current week", () => {
    const now = new Date("2025-03-10T12:00:00Z"); // Monday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    const monDate = format(weekStart, "yyyy-MM-dd'T'10:00:00");
    const wedDate = format(addDays(weekStart, 2), "yyyy-MM-dd'T'14:00:00");
    const outDate = format(subDays(weekStart, 2), "yyyy-MM-dd'T'09:00:00"); // previous Saturday

    const sessions: FocusSession[] = [
      { id: "1", date: monDate, durationMin: 45 },
      { id: "2", date: monDate, durationMin: 30 },
      { id: "3", date: wedDate, durationMin: 60 },
      { id: "4", date: outDate, durationMin: 120 }, // Should be excluded from this week
    ];

    const result = getWeeklyFocus(sessions, now);

    expect(result[0]).toEqual({ day: "Mon", date: format(weekStart, "yyyy-MM-dd"), minutes: 75 });
    expect(result[2]).toEqual({ day: "Wed", date: format(addDays(weekStart, 2), "yyyy-MM-dd"), minutes: 60 });
    expect(result[1].minutes).toBe(0); // Tue
    expect(result[3].minutes).toBe(0); // Thu
  });

  it("handles large dataset (14,000 sessions) efficiently", { timeout: 20000 }, () => {
    const now = new Date("2025-03-10T12:00:00Z");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 14,000 sessions distributed evenly across 14 consecutive days starting from weekStart
    const count = 14000;
    const sessions: FocusSession[] = Array.from({ length: count }, (_, i) => {
      const dayOffset = i % 14;
      const sessionDate = addDays(weekStart, dayOffset);
      return {
        id: `session-${i}`,
        date: format(sessionDate, "yyyy-MM-dd'T'10:00:00"),
        durationMin: 25,
      };
    });

    // Warm up call
    getWeeklyFocus(sessions, now);

    const start = performance.now();
    const runs = 10;
    for (let r = 0; r < runs; r++) {
      getWeeklyFocus(sessions, now);
    }
    const duration = performance.now() - start;

    const result = getWeeklyFocus(sessions, now);
    // For 14,000 sessions distributed across 14 days, 7,000 sessions fall in the target week (1,000 per day).
    // 1,000 sessions * 25 min = 25,000 min per day.
    expect(result[0].minutes).toBe(25000);
    expect(result[6].minutes).toBe(25000);

    // Ensure 10 runs over 14,000 sessions execute swiftly (< 2000ms total, ~200ms per call threshold)
    expect(duration).toBeLessThan(2000);
  });
});
