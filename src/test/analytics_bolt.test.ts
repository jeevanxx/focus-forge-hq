import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/mock-data";
import { startOfWeek, addDays } from "date-fns";

describe("getWeeklyFocus performance & correctness", () => {
  it("correctly buckets sessions for the week", () => {
    const now = new Date("2023-10-15T12:00:00Z"); // Sunday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday, Oct 9

    const sessions: FocusSession[] = [
      {
        id: "s1",
        date: addDays(weekStart, 0).toISOString(), // Mon, Oct 9
        durationMin: 30,
      },
      {
        id: "s2",
        date: addDays(weekStart, 2).toISOString(), // Wed, Oct 11
        durationMin: 45,
      },
      {
        id: "s3",
        date: addDays(weekStart, 2).toISOString(), // Wed, Oct 11 (second session)
        durationMin: 15,
      },
      {
        id: "s4",
        date: addDays(weekStart, 6).toISOString(), // Sun, Oct 15
        durationMin: 60,
      },
      {
        id: "s5",
        date: addDays(weekStart, -1).toISOString(), // Out of bounds (before)
        durationMin: 90,
      },
      {
        id: "s6",
        date: addDays(weekStart, 7).toISOString(), // Out of bounds (after)
        durationMin: 120,
      },
    ];

    const result = getWeeklyFocus(sessions, now);

    expect(result).toHaveLength(7);
    expect(result[0]).toEqual({ day: "Mon", date: "2023-10-09", minutes: 30 });
    expect(result[1]).toEqual({ day: "Tue", date: "2023-10-10", minutes: 0 });
    expect(result[2]).toEqual({ day: "Wed", date: "2023-10-11", minutes: 60 });
    expect(result[3]).toEqual({ day: "Thu", date: "2023-10-12", minutes: 0 });
    expect(result[4]).toEqual({ day: "Fri", date: "2023-10-13", minutes: 0 });
    expect(result[5]).toEqual({ day: "Sat", date: "2023-10-14", minutes: 0 });
    expect(result[6]).toEqual({ day: "Sun", date: "2023-10-15", minutes: 60 });
  });

  it("benchmarks high performance scale with 10,000 sessions", () => {
    const now = new Date("2023-10-15T12:00:00Z");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 10,000 mock sessions distributed evenly across the week and some out-of-bounds
    const largeSessions: FocusSession[] = Array.from({ length: 10000 }).map((_, i) => {
      const dayOffset = (i % 9) - 1; // -1 to 7 offset
      const date = addDays(weekStart, dayOffset);
      date.setHours(12, 0, 0, 0);
      return {
        id: `s${i}`,
        date: date.toISOString(),
        durationMin: 10,
      };
    });

    const start = performance.now();
    const result = getWeeklyFocus(largeSessions, now);
    const end = performance.now();
    const duration = end - start;

    expect(result).toHaveLength(7);
    // Verified performance execution duration is fast
    console.log(`Weekly focus computation for 10k sessions took ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(100); // Expecting <100ms on local container setup
  });
});
