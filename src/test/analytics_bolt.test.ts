import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "@/lib/analytics";
import type { FocusSession } from "@/lib/mock-data";
import { startOfWeek, addDays, format } from "date-fns";

describe("getWeeklyFocus - Correctness & Benchmark Regression Test", () => {
  const now = new Date("2023-10-25T12:00:00Z"); // A Wednesday
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday, Oct 23

  it("calculates weekly focus minutes correctly for standard session logs", () => {
    const sessions: FocusSession[] = [
      // Monday (Oct 23)
      { id: "s1", date: "2023-10-23T09:00:00Z", durationMin: 25 },
      { id: "s2", date: "2023-10-23T14:30:00Z", durationMin: 45 },
      // Wednesday (Oct 25)
      { id: "s3", date: "2023-10-25T11:00:00Z", durationMin: 50 },
      // Sunday (Oct 29)
      { id: "s4", date: "2023-10-29T21:00:00Z", durationMin: 30 },
      // Out of bounds: Sunday before Monday (Oct 22)
      { id: "s5", date: "2023-10-22T23:59:00Z", durationMin: 120 },
      // Out of bounds: Next Monday (Oct 30)
      { id: "s6", date: "2023-10-30T00:00:00Z", durationMin: 100 },
    ];

    const weeklyFocus = getWeeklyFocus(sessions, now);

    // Monday (Oct 23) should have 25 + 45 = 70 min
    expect(weeklyFocus[0].day).toBe("Mon");
    expect(weeklyFocus[0].date).toBe("2023-10-23");
    expect(weeklyFocus[0].minutes).toBe(70);

    // Tuesday (Oct 24) should have 0 min
    expect(weeklyFocus[1].day).toBe("Tue");
    expect(weeklyFocus[1].date).toBe("2023-10-24");
    expect(weeklyFocus[1].minutes).toBe(0);

    // Wednesday (Oct 25) should have 50 min
    expect(weeklyFocus[2].day).toBe("Wed");
    expect(weeklyFocus[2].date).toBe("2023-10-25");
    expect(weeklyFocus[2].minutes).toBe(50);

    // Sunday (Oct 29) should have 30 min
    expect(weeklyFocus[6].day).toBe("Sun");
    expect(weeklyFocus[6].date).toBe("2023-10-29");
    expect(weeklyFocus[6].minutes).toBe(30);
  });

  it("handles empty sessions array correctly", () => {
    const weeklyFocus = getWeeklyFocus([], now);
    expect(weeklyFocus.length).toBe(7);
    weeklyFocus.forEach((dayFocus) => {
      expect(dayFocus.minutes).toBe(0);
    });
  });

  it("benchmarks 10,000 focus sessions to ensure lightning-fast O(N) performance", () => {
    const numSessions = 10000;
    const largeSessionsList: FocusSession[] = [];

    // Generate 10,000 sessions distributed across days inside and outside the week
    for (let i = 0; i < numSessions; i++) {
      // Pick a day index between -3 and +10
      const offsetDays = -3 + (i % 14);
      const sessionDate = addDays(weekStart, offsetDays);
      sessionDate.setHours(9 + (i % 8), i % 60, 0, 0);

      largeSessionsList.push({
        id: `bench_${i}`,
        date: sessionDate.toISOString(),
        durationMin: 25,
      });
    }

    const start = performance.now();
    const result = getWeeklyFocus(largeSessionsList, now);
    const end = performance.now();
    const durationMs = end - start;

    console.log(`⚡ Bolt Bench: O(N) getWeeklyFocus finished 10,000 sessions in ${durationMs.toFixed(2)}ms`);

    // Verify correct properties
    expect(result.length).toBe(7);
    // The total processed minutes for the week should be greater than zero
    const totalMin = result.reduce((sum, d) => sum + d.minutes, 0);
    expect(totalMin).toBeGreaterThan(0);

    // Ensure the runtime is extremely fast (within standard limits, safely below 20000ms Vitest default limit)
    expect(durationMs).toBeLessThan(100); // Expect <100ms for single-pass O(N) on any reasonable sandbox CPU
  });
});
