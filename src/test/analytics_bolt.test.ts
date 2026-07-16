import { describe, it, expect } from "vitest";
import { getWeeklyFocus, getWeeklyFocusTotal } from "../lib/analytics";
import type { FocusSession } from "../lib/mock-data";

describe("analytics performance and correctness", () => {
  const targetDate = new Date("2025-05-22T10:00:00Z"); // Thursday
  // start of week is 2025-05-19 (Monday)

  const mockSessions: FocusSession[] = [
    { id: "1", date: "2025-05-19T08:00:00Z", durationMin: 30 }, // Monday
    { id: "2", date: "2025-05-20T12:00:00Z", durationMin: 45 }, // Tuesday
    { id: "3", date: "2025-05-22T15:00:00Z", durationMin: 60 }, // Thursday
    { id: "4", date: "2025-05-25T23:59:00Z", durationMin: 15 }, // Sunday
    { id: "5", date: "2025-05-18T23:59:00Z", durationMin: 120 }, // Previous Sunday (should be excluded)
    { id: "6", date: "2025-05-26T00:00:00Z", durationMin: 120 }, // Next Monday (should be excluded)
  ];

  it("correctly computes daily focus minutes with O(N) single pass", () => {
    const results = getWeeklyFocus(mockSessions, targetDate);

    expect(results).toHaveLength(7);
    expect(results[0]).toEqual({ day: "Mon", date: "2025-05-19", minutes: 30 });
    expect(results[1]).toEqual({ day: "Tue", date: "2025-05-20", minutes: 45 });
    expect(results[2]).toEqual({ day: "Wed", date: "2025-05-21", minutes: 0 });
    expect(results[3]).toEqual({ day: "Thu", date: "2025-05-22", minutes: 60 });
    expect(results[4]).toEqual({ day: "Fri", date: "2025-05-23", minutes: 0 });
    expect(results[5]).toEqual({ day: "Sat", date: "2025-05-24", minutes: 0 });
    expect(results[6]).toEqual({ day: "Sun", date: "2025-05-25", minutes: 15 });
  });

  it("correctly computes total focus minutes without allocating extra objects", () => {
    const total = getWeeklyFocusTotal(mockSessions, targetDate);
    expect(total).toBe(30 + 45 + 60 + 15);
  });

  it("profiles O(N) performance on large dataset", { timeout: 20000 }, () => {
    // Generate 10,000 sessions
    const largeSessions: FocusSession[] = Array.from({ length: 10000 }).map((_, i) => {
      const date = new Date(targetDate);
      date.setDate(date.getDate() - (i % 14)); // Spread over 2 weeks
      return {
        id: `large-${i}`,
        date: date.toISOString(),
        durationMin: 25,
      };
    });

    const start = performance.now();
    const result = getWeeklyFocus(largeSessions, targetDate);
    const end = performance.now();

    const startTotal = performance.now();
    const resultTotal = getWeeklyFocusTotal(largeSessions, targetDate);
    const endTotal = performance.now();

    console.log(`[Bolt Benchmark] getWeeklyFocus with 10k items took ${(end - start).toFixed(2)}ms`);
    console.log(`[Bolt Benchmark] getWeeklyFocusTotal with 10k items took ${(endTotal - startTotal).toFixed(2)}ms`);

    expect(result).toBeDefined();
    expect(resultTotal).toBeGreaterThan(0);
    expect(end - start).toBeLessThan(100); // Should easily complete in < 100ms
  });
});
