import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/mock-data";
import { addDays, startOfWeek } from "date-fns";

describe("Weekly Focus Benchmark and Correctness", () => {
  it("computes daily focus minutes correctly on mock data", () => {
    const now = new Date("2023-10-15T12:00:00Z");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    const sessions: FocusSession[] = [
      {
        id: "s1",
        date: addDays(weekStart, 0).toISOString(), // Mon
        durationMin: 25,
      },
      {
        id: "s2",
        date: addDays(weekStart, 0).toISOString(), // Mon
        durationMin: 50,
      },
      {
        id: "s3",
        date: addDays(weekStart, 2).toISOString(), // Wed
        durationMin: 90,
      },
      {
        id: "s4",
        date: addDays(weekStart, 6).toISOString(), // Sun
        durationMin: 15,
      },
      // Session outside this week
      {
        id: "s5",
        date: addDays(weekStart, -1).toISOString(), // Last week's Sunday
        durationMin: 120,
      },
    ];

    const result = getWeeklyFocus(sessions, now);
    expect(result).toHaveLength(7);
    expect(result[0].day).toBe("Mon");
    expect(result[0].minutes).toBe(75);
    expect(result[1].day).toBe("Tue");
    expect(result[1].minutes).toBe(0);
    expect(result[2].day).toBe("Wed");
    expect(result[2].minutes).toBe(90);
    expect(result[6].day).toBe("Sun");
    expect(result[6].minutes).toBe(15);
  });

  it("profiles baseline performance with 10,000 sessions", () => {
    const now = new Date("2023-10-15T12:00:00Z");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 10,000 sessions distributed across days
    const sessions: FocusSession[] = [];
    for (let i = 0; i < 10000; i++) {
      const dayOffset = (i % 9) - 1; // -1 to 7 (covers inside and outside the week)
      sessions.push({
        id: `bench_${i}`,
        date: addDays(weekStart, dayOffset).toISOString(),
        durationMin: 30,
      });
    }

    const start = performance.now();
    const result = getWeeklyFocus(sessions, now);
    const end = performance.now();

    console.log(`[PROFILE] getWeeklyFocus execution time for 10,000 sessions: ${(end - start).toFixed(2)}ms`);

    expect(result).toHaveLength(7);
  });
});
