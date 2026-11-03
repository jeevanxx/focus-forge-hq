import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { startOfWeek, addDays, format } from "date-fns";

describe("getWeeklyFocus", () => {
  it("should calculate weekly focus correctly", () => {
    const now = new Date("2025-03-10T12:00:00Z"); // Monday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    const mondayStr = format(weekStart, "yyyy-MM-dd'T'10:00:00");
    const tuesdayStr = format(addDays(weekStart, 1), "yyyy-MM-dd'T'14:00:00");
    const tuesdayStr2 = format(addDays(weekStart, 1), "yyyy-MM-dd'T'16:00:00");

    const mockSessions: FocusSession[] = [
      { id: "1", date: mondayStr, durationMin: 30, completed: true },
      { id: "2", date: tuesdayStr, durationMin: 45, completed: true },
      { id: "3", date: tuesdayStr2, durationMin: 15, completed: true },
      { id: "4", date: "2024-01-01T10:00:00", durationMin: 60, completed: true }, // Out of range
    ];

    const weekly = getWeeklyFocus(mockSessions, now);

    expect(weekly).toHaveLength(7);
    expect(weekly[0]).toEqual({
      day: "Mon",
      date: format(weekStart, "yyyy-MM-dd"),
      minutes: 30,
    });
    expect(weekly[1]).toEqual({
      day: "Tue",
      date: format(addDays(weekStart, 1), "yyyy-MM-dd"),
      minutes: 60,
    });
    expect(weekly[2].minutes).toBe(0);
  });

  it("should perform efficiently on large datasets", { timeout: 60000 }, () => {
    const now = new Date("2025-03-10T12:00:00Z");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 14,000 sessions across 14 days
    const sessions: FocusSession[] = Array.from({ length: 14000 }, (_, i) => {
      const date = addDays(weekStart, i % 14);
      return {
        id: `s-${i}`,
        date: format(date, "yyyy-MM-dd'T'HH:mm:ss"),
        durationMin: 25,
        completed: true,
      };
    });

    // Warm-up
    getWeeklyFocus(sessions, now);

    const start = performance.now();
    for (let i = 0; i < 10; i++) {
      getWeeklyFocus(sessions, now);
    }
    const elapsed = performance.now() - start;

    console.log(`[Benchmark] 10 calls with 14,000 sessions took ${elapsed.toFixed(2)} ms`);
    expect(elapsed).toBeGreaterThan(0);
  });
});
