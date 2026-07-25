import { describe, test, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/mock-data";
import { addDays, startOfWeek } from "date-fns";

describe("getWeeklyFocus performance regression test", () => {
  test("calculates weekly focus correctly", () => {
    const now = new Date("2026-03-02T12:00:00Z"); // a Monday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    const sessions: FocusSession[] = [
      { id: "1", date: addDays(weekStart, 0).toISOString(), durationMin: 30 },
      { id: "2", date: addDays(weekStart, 0).toISOString(), durationMin: 20 },
      { id: "3", date: addDays(weekStart, 2).toISOString(), durationMin: 45 },
      { id: "4", date: addDays(weekStart, 6).toISOString(), durationMin: 60 },
      // outside the week:
      { id: "5", date: addDays(weekStart, -1).toISOString(), durationMin: 10 },
      { id: "6", date: addDays(weekStart, 7).toISOString(), durationMin: 15 },
    ];

    const result = getWeeklyFocus(sessions, now);
    expect(result).toHaveLength(7);
    expect(result[0].minutes).toBe(50); // Mon
    expect(result[1].minutes).toBe(0);  // Tue
    expect(result[2].minutes).toBe(45); // Wed
    expect(result[6].minutes).toBe(60); // Sun
  });

  test("runs efficiently (O(N)) with large dataset", { timeout: 20000 }, () => {
    const now = new Date("2026-03-02T12:00:00Z");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 10,000 sessions
    const sessions: FocusSession[] = [];
    for (let i = 0; i < 10000; i++) {
      const dayOffset = i % 14 - 3; // some outside, some inside
      const date = addDays(weekStart, dayOffset);
      sessions.push({
        id: `s-${i}`,
        date: date.toISOString(),
        durationMin: 10,
      });
    }

    const start = performance.now();
    const result = getWeeklyFocus(sessions, now);
    const end = performance.now();
    const duration = end - start;

    console.log(`[PROFILE] getWeeklyFocus with 10,000 sessions took ${duration.toFixed(2)}ms`);

    expect(result).toHaveLength(7);
    // 10000 / 14 = ~714.28 sessions per offset.
    // offsets 0, 1, 2, 3, 4, 5, 6 are inside the week.
    // For each offset, we expect a non-zero minutes.
    for (let i = 0; i < 7; i++) {
      expect(result[i].minutes).toBeGreaterThan(0);
    }
  });
});
