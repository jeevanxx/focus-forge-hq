import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/mock-data";
import { addDays, startOfWeek } from "date-fns";

describe("getWeeklyFocus performance & regression tests", () => {
  it("should correctly aggregate sessions into the correct days and exclude out-of-range sessions", () => {
    const now = new Date("2025-05-22"); // Thursday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday 2025-05-19

    const sessions: FocusSession[] = [
      {
        id: "s1",
        date: addDays(weekStart, 0).toISOString(), // Mon
        durationMin: 30,
      },
      {
        id: "s2",
        date: addDays(weekStart, 0).toISOString(), // Mon
        durationMin: 20,
      },
      {
        id: "s3",
        date: addDays(weekStart, 2).toISOString(), // Wed
        durationMin: 45,
      },
      {
        id: "s4",
        date: addDays(weekStart, 6).toISOString(), // Sun
        durationMin: 60,
      },
      {
        id: "s5",
        date: addDays(weekStart, -1).toISOString(), // Last Sunday (out of range)
        durationMin: 100,
      },
      {
        id: "s6",
        date: addDays(weekStart, 7).toISOString(), // Next Monday (out of range)
        durationMin: 120,
      },
    ];

    const result = getWeeklyFocus(sessions, now);

    expect(result).toHaveLength(7);
    expect(result[0]).toEqual({ day: "Mon", date: "2025-05-19", minutes: 50 });
    expect(result[1]).toEqual({ day: "Tue", date: "2025-05-20", minutes: 0 });
    expect(result[2]).toEqual({ day: "Wed", date: "2025-05-21", minutes: 45 });
    expect(result[3]).toEqual({ day: "Thu", date: "2025-05-22", minutes: 0 });
    expect(result[4]).toEqual({ day: "Fri", date: "2025-05-23", minutes: 0 });
    expect(result[5]).toEqual({ day: "Sat", date: "2025-05-24", minutes: 0 });
    expect(result[6]).toEqual({ day: "Sun", date: "2025-05-25", minutes: 60 });
  });

  it(
    "should scale efficiently with 10,000 sessions (benchmark)",
    { timeout: 20000 },
    () => {
      const now = new Date("2025-05-22");
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });

      // Generate 10,000 mock sessions
      const sessions: FocusSession[] = Array.from({ length: 10000 }).map((_, i) => ({
        id: `s${i}`,
        date: addDays(weekStart, i % 7).toISOString(),
        durationMin: 10,
      }));

      const startTime = performance.now();
      const result = getWeeklyFocus(sessions, now);
      const endTime = performance.now();

      const duration = endTime - startTime;
      console.log(`[BENCHMARK] getWeeklyFocus with 10,000 sessions completed in: ${duration.toFixed(2)}ms`);

      expect(result).toHaveLength(7);

      // Calculate exactly how many elements each index should have
      // 10000 % 7 = 4, so first 4 days (Mon, Tue, Wed, Thu) have 1429 elements.
      // The remaining 3 days (Fri, Sat, Sun) have 1428 elements.
      expect(result[0].minutes).toBe(14290);
      expect(result[1].minutes).toBe(14290);
      expect(result[2].minutes).toBe(14290);
      expect(result[3].minutes).toBe(14290);
      expect(result[4].minutes).toBe(14280);
      expect(result[5].minutes).toBe(14280);
      expect(result[6].minutes).toBe(14280);

      // Verify overall sum
      const totalMinutes = result.reduce((sum, r) => sum + r.minutes, 0);
      expect(totalMinutes).toBe(100000);
    }
  );
});
