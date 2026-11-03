import { describe, test, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { startOfWeek, addDays, format } from "date-fns";

describe("getWeeklyFocus", () => {
  const now = new Date("2025-02-24T12:00:00Z"); // Monday
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });

  test("correctly calculates focus minutes for each day of the week", () => {
    const mondayISO = format(addDays(weekStart, 0), "yyyy-MM-dd'T'10:00:00");
    const wednesdayISO = format(addDays(weekStart, 2), "yyyy-MM-dd'T'14:00:00");

    const sessions: FocusSession[] = [
      { id: "1", durationMin: 25, date: mondayISO, createdAt: mondayISO },
      { id: "2", durationMin: 50, date: mondayISO, createdAt: mondayISO },
      { id: "3", durationMin: 30, date: wednesdayISO, createdAt: wednesdayISO },
      // Session outside this week
      { id: "4", durationMin: 60, date: "2024-01-01T10:00:00", createdAt: "2024-01-01T10:00:00" },
    ];

    const result = getWeeklyFocus(sessions, now);

    expect(result).toHaveLength(7);
    expect(result[0].day).toBe("Mon");
    expect(result[0].minutes).toBe(75); // 25 + 50
    expect(result[1].day).toBe("Tue");
    expect(result[1].minutes).toBe(0);
    expect(result[2].day).toBe("Wed");
    expect(result[2].minutes).toBe(30);
  });

  test("handles 14,000 sessions efficiently (benchmark)", () => {
    // Generate 14,000 sessions evenly distributed across 14 days
    const sessions: FocusSession[] = [];
    for (let i = 0; i < 14000; i++) {
      const dayOffset = i % 14;
      const sessionDate = format(addDays(weekStart, dayOffset), "yyyy-MM-dd'T'10:00:00");
      sessions.push({
        id: `s-${i}`,
        durationMin: 25,
        date: sessionDate,
        createdAt: sessionDate,
      });
    }

    // Warm-up call to avoid JIT noise
    getWeeklyFocus(sessions, now);

    const start = performance.now();
    const result = getWeeklyFocus(sessions, now);
    const elapsed = performance.now() - start;

    console.log(`[BENCHMARK] getWeeklyFocus elapsed: ${elapsed.toFixed(2)} ms for 14,000 sessions`);

    expect(result).toHaveLength(7);
    // 14,000 / 14 = 1,000 sessions per day * 25 min = 25,000 min per day for Mon-Sun
    expect(result[0].minutes).toBe(25000);

    // Ensure execution time is fast (< 200ms threshold for test runners)
    expect(elapsed).toBeLessThan(200);
  }, 20000);
});
