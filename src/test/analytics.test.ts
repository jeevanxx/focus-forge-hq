import { describe, test, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { startOfWeek, addDays, format } from "date-fns";

describe("getWeeklyFocus analytics optimization", () => {
  test("correctly calculates weekly focus minutes", () => {
    const now = new Date("2025-01-15T12:00:00Z"); // Wed
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Mon 2025-01-13
    const monDate = format(weekStart, "yyyy-MM-dd");
    const tueDate = format(addDays(weekStart, 1), "yyyy-MM-dd");

    const sessions: FocusSession[] = [
      { id: "1", date: `${monDate}T09:00:00.000Z`, durationMin: 45 },
      { id: "2", date: `${monDate}T14:00:00.000Z`, durationMin: 30 },
      { id: "3", date: `${tueDate}T10:00:00.000Z`, durationMin: 60 },
      { id: "4", date: "2024-01-01T10:00:00.000Z", durationMin: 120 }, // Outside week
    ];

    const result = getWeeklyFocus(sessions, now);

    expect(result).toHaveLength(7);
    expect(result[0]).toEqual({ day: "Mon", date: monDate, minutes: 75 });
    expect(result[1]).toEqual({ day: "Tue", date: tueDate, minutes: 60 });
    expect(result[2].minutes).toBe(0);
    expect(result[3].minutes).toBe(0);
    expect(result[4].minutes).toBe(0);
    expect(result[5].minutes).toBe(0);
    expect(result[6].minutes).toBe(0);
  });

  test("performance benchmark for getWeeklyFocus with large session count", () => {
    const now = new Date("2025-01-15T12:00:00Z");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 14,000 focus sessions spread across 14 days (half inside current week, half outside)
    const sessions: FocusSession[] = [];
    for (let i = 0; i < 14000; i++) {
      const dayOffset = i % 14;
      const sessionDate = addDays(weekStart, dayOffset);
      sessions.push({
        id: `sess-${i}`,
        date: sessionDate.toISOString(),
        durationMin: 25,
      });
    }

    // Warm-up
    getWeeklyFocus(sessions, now);

    const iterations = 10;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      getWeeklyFocus(sessions, now);
    }
    const totalMs = performance.now() - start;
    const avgMs = totalMs / iterations;

    console.log(`getWeeklyFocus average execution time over ${iterations} runs (14,000 sessions): ${avgMs.toFixed(3)}ms`);

    expect(avgMs).toBeGreaterThan(0);
  }, 20000);
});
