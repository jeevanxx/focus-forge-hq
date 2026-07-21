import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/mock-data";
import { addDays, startOfWeek } from "date-fns";

describe("getWeeklyFocus performance & correctness", () => {
  it("should correctly compute weekly focus minutes for small dataset", () => {
    const now = new Date("2026-05-15T12:00:00Z"); // a Friday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday, May 11, 2026

    const sessions: FocusSession[] = [
      { id: "1", date: addDays(weekStart, 0).toISOString(), durationMin: 25 }, // Mon
      { id: "2", date: addDays(weekStart, 0).toISOString(), durationMin: 35 }, // Mon
      { id: "3", date: addDays(weekStart, 2).toISOString(), durationMin: 45 }, // Wed
      { id: "4", date: addDays(weekStart, 4).toISOString(), durationMin: 60 }, // Fri
      { id: "5", date: addDays(weekStart, 6).toISOString(), durationMin: 90 }, // Sun
      // Session out of range (next week)
      { id: "6", date: addDays(weekStart, 7).toISOString(), durationMin: 120 },
    ];

    const weeklyFocus = getWeeklyFocus(sessions, now);

    expect(weeklyFocus).toHaveLength(7);
    expect(weeklyFocus[0].minutes).toBe(60); // Monday
    expect(weeklyFocus[1].minutes).toBe(0);  // Tuesday
    expect(weeklyFocus[2].minutes).toBe(45); // Wednesday
    expect(weeklyFocus[3].minutes).toBe(0);  // Thursday
    expect(weeklyFocus[4].minutes).toBe(60); // Friday
    expect(weeklyFocus[5].minutes).toBe(0);  // Saturday
    expect(weeklyFocus[6].minutes).toBe(90); // Sunday
  });

  it("should perform exceptionally well with 10,000 sessions (O(N) verification)", () => {
    const now = new Date("2026-05-15T12:00:00Z");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 10,000 focus sessions
    const sessions: FocusSession[] = Array.from({ length: 10000 }).map((_, i) => {
      const dayOffset = i % 10; // some inside the week, some outside
      return {
        id: `s${i}`,
        date: addDays(weekStart, dayOffset).toISOString(),
        durationMin: 20,
      };
    });

    const start = performance.now();
    const result = getWeeklyFocus(sessions, now);
    const end = performance.now();
    const duration = end - start;

    expect(result).toHaveLength(7);
    // Ensure accurate aggregations
    // i % 10 will yield offsets 0 to 9. Offsets 0 to 6 are within the week.
    // Each offset 0..6 should appear 1000 times out of 10,000.
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      expect(result[dayOffset].minutes).toBe(20000);
    }

    console.log(`[Bolt performance measure] getWeeklyFocus with 10,000 sessions took: ${duration.toFixed(2)}ms`);
    // Ensure it completes in under 100ms (an O(N^2) or nested iteration implementation takes significantly longer)
    expect(duration).toBeLessThan(100);
  });
});
