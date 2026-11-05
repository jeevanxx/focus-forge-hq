import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "@/lib/analytics";
import type { FocusSession } from "@/lib/types";
import { startOfWeek, addDays, format } from "date-fns";

describe("analytics performance and correctness", () => {
  it("correctly aggregates weekly focus sessions", () => {
    const fixedNow = new Date("2025-05-14T12:00:00.000Z"); // A Wednesday
    const weekStart = startOfWeek(fixedNow, { weekStartsOn: 1 }); // Monday

    const sessions: FocusSession[] = [
      {
        id: "1",
        date: format(weekStart, "yyyy-MM-dd'T'10:00:00"),
        durationMin: 25,
      },
      {
        id: "2",
        date: format(weekStart, "yyyy-MM-dd'T'14:00:00"),
        durationMin: 35,
      },
      {
        id: "3",
        date: format(addDays(weekStart, 2), "yyyy-MM-dd'T'09:00:00"),
        durationMin: 50,
      },
    ];

    const result = getWeeklyFocus(sessions, fixedNow);
    expect(result).toHaveLength(7);
    expect(result[0].day).toBe("Mon");
    expect(result[0].minutes).toBe(60);
    expect(result[1].day).toBe("Tue");
    expect(result[1].minutes).toBe(0);
    expect(result[2].day).toBe("Wed");
    expect(result[2].minutes).toBe(50);
  });

  it("benchmarks getWeeklyFocus execution", () => {
    const fixedNow = new Date("2025-05-14T12:00:00.000Z");
    const weekStart = startOfWeek(fixedNow, { weekStartsOn: 1 });

    // Generate 14,000 sessions (multiple of 14 for even distribution)
    const sessions: FocusSession[] = [];
    for (let i = 0; i < 14000; i++) {
      const dayOffset = i % 14;
      const sessionDate = addDays(weekStart, dayOffset);
      sessions.push({
        id: `sess-${i}`,
        date: format(sessionDate, "yyyy-MM-dd'T'10:00:00"),
        durationMin: 10,
      });
    }

    // Warm-up JIT
    getWeeklyFocus(sessions.slice(0, 50), fixedNow);

    const start = performance.now();
    const iterations = 5;
    for (let iter = 0; iter < iterations; iter++) {
      getWeeklyFocus(sessions, fixedNow);
    }
    const duration = performance.now() - start;
    const avgMs = duration / iterations;

    console.log(`[Benchmark] getWeeklyFocus (14,000 items): avg ${avgMs.toFixed(2)}ms per call`);
    expect(avgMs).toBeLessThan(1000);
  }, 20000);
});
