import { describe, it, expect } from "vitest";
import { getWeeklyFocus, DailyFocus } from "../lib/analytics";
import { FocusSession } from "../lib/mock-data";

describe("getWeeklyFocus Performance and Correctness Benchmark", () => {
  it("correctly aggregates weekly focus sessions", () => {
    const now = new Date("2025-05-15T12:00:00Z"); // This is a Thursday
    // Mon: May 12, Tue: May 13, Wed: May 14, Thu: May 15, Fri: May 16, Sat: May 17, Sun: May 18
    const sessions: FocusSession[] = [
      { id: "1", date: "2025-05-12T09:00:00Z", durationMin: 30, taskId: "t1" },
      { id: "2", date: "2025-05-12T14:00:00Z", durationMin: 45, taskId: "t1" },
      { id: "3", date: "2025-05-14T10:00:00Z", durationMin: 60, taskId: "t2" },
      { id: "4", date: "2025-05-15T18:00:00Z", durationMin: 20, taskId: "t3" },
      { id: "5", date: "2025-05-19T08:00:00Z", durationMin: 50, taskId: "t4" }, // Next week Mon, should not match
    ];

    const result = getWeeklyFocus(sessions, now);

    expect(result).toHaveLength(7);
    expect(result[0]).toEqual({ day: "Mon", date: "2025-05-12", minutes: 75 });
    expect(result[1]).toEqual({ day: "Tue", date: "2025-05-13", minutes: 0 });
    expect(result[2]).toEqual({ day: "Wed", date: "2025-05-14", minutes: 60 });
    expect(result[3]).toEqual({ day: "Thu", date: "2025-05-15", minutes: 20 });
    expect(result[4]).toEqual({ day: "Fri", date: "2025-05-16", minutes: 0 });
    expect(result[5]).toEqual({ day: "Sat", date: "2025-05-17", minutes: 0 });
    expect(result[6]).toEqual({ day: "Sun", date: "2025-05-18", minutes: 0 });
  });

  it("handles empty sessions array securely", () => {
    const now = new Date("2025-05-15T12:00:00Z");
    const result = getWeeklyFocus([], now);
    expect(result).toHaveLength(7);
    result.forEach((dayFocus) => {
      expect(dayFocus.minutes).toBe(0);
    });
  });

  it("benchmarks performance over 10,000 sessions within performance budget", { timeout: 20000 }, () => {
    const now = new Date("2025-05-15T12:00:00Z");

    // Generate 10,000 mock sessions
    const largeSessions: FocusSession[] = [];
    const dateOptions = [
      "2025-05-12T10:00:00Z",
      "2025-05-13T11:00:00Z",
      "2025-05-14T12:00:00Z",
      "2025-05-15T13:00:00Z",
      "2025-05-16T14:00:00Z",
      "2025-05-17T15:00:00Z",
      "2025-05-18T16:00:00Z",
      "2025-05-19T17:00:00Z", // Outside current week
    ];

    for (let i = 0; i < 10000; i++) {
      largeSessions.push({
        id: `session-${i}`,
        date: dateOptions[i % dateOptions.length],
        durationMin: 15,
        taskId: "t-any",
      });
    }

    const start = performance.now();
    const result = getWeeklyFocus(largeSessions, now);
    const end = performance.now();
    const duration = end - start;

    console.log(`[WeeklyFocus Benchmark] Execution time for 10,000 sessions: ${duration.toFixed(2)}ms`);

    expect(result).toHaveLength(7);
    // Each of the 7 days should have 1250 sessions * 15 min = 18750 minutes
    result.forEach((dayFocus) => {
      expect(dayFocus.minutes).toBe(1250 * 15);
    });

    // An O(N) optimized implementation easily completes 10,000 parseISO & formats in less than 150ms.
    // We assert a very generous budget (e.g., 250ms) to ensure continuous fast execution in all environments.
    expect(duration).toBeLessThan(250);
  });
});
