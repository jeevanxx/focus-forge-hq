import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import { FocusSession } from "../lib/mock-data";
import { startOfWeek, addDays, format } from "date-fns";

describe("getWeeklyFocus performance & correctness benchmark", () => {
  it("correctly aggregates focus minutes per day", () => {
    const now = new Date("2025-01-20T12:00:00Z"); // Monday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Jan 20, 2025

    const sessions: FocusSession[] = [
      {
        id: "s1",
        date: addDays(weekStart, 0).toISOString(), // Mon
        durationMin: 25,
      },
      {
        id: "s2",
        date: addDays(weekStart, 0).toISOString(), // Mon
        durationMin: 45,
      },
      {
        id: "s3",
        date: addDays(weekStart, 2).toISOString(), // Wed
        durationMin: 50,
      },
      {
        id: "s4",
        date: addDays(weekStart, 6).toISOString(), // Sun
        durationMin: 120,
      },
    ];

    const result = getWeeklyFocus(sessions, now);
    expect(result).toHaveLength(7);

    // Mon (Jan 20)
    expect(result[0]).toEqual({
      day: "Mon",
      date: "2025-01-20",
      minutes: 70,
    });
    // Tue (Jan 21)
    expect(result[1]).toEqual({
      day: "Tue",
      date: "2025-01-21",
      minutes: 0,
    });
    // Wed (Jan 22)
    expect(result[2]).toEqual({
      day: "Wed",
      date: "2025-01-22",
      minutes: 50,
    });
    // Thu, Fri, Sat are 0
    expect(result[3].minutes).toBe(0);
    expect(result[4].minutes).toBe(0);
    expect(result[5].minutes).toBe(0);
    // Sun (Jan 26)
    expect(result[6]).toEqual({
      day: "Sun",
      date: "2025-01-26",
      minutes: 120,
    });
  });

  it("profiles execution with a large dataset", { timeout: 20000 }, () => {
    const now = new Date("2025-01-20T12:00:00Z"); // Monday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 10,000 sessions distributed across days
    const sessions: FocusSession[] = [];
    for (let i = 0; i < 10000; i++) {
      const dayOffset = i % 7;
      const date = addDays(weekStart, dayOffset);
      sessions.push({
        id: `s-${i}`,
        date: date.toISOString(),
        durationMin: 30,
      });
    }

    const start = performance.now();
    const result = getWeeklyFocus(sessions, now);
    const end = performance.now();
    const duration = end - start;

    console.log(`[Benchmark] getWeeklyFocus execution with 10,000 sessions took ${duration.toFixed(2)}ms`);

    expect(result).toHaveLength(7);
    for (let i = 0; i < 7; i++) {
      // 10000 / 7 is around 1428 or 1429
      expect(result[i].minutes).toBeGreaterThan(0);
    }
  });
});
