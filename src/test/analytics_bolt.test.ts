
import { describe, it, expect, vi } from "vitest";
import { getWeeklyFocus, getWeeklyFocusTotal } from "../lib/analytics";
import { FocusSession } from "../lib/mock-data";
import { addDays, startOfWeek } from "date-fns";

describe("Analytics Performance Benchmark", () => {
  const now = new Date("2024-05-20T10:00:00Z");
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });

  // Generate 10,000 sessions spread across the week
  const largeSessions: FocusSession[] = Array.from({ length: 10000 }).map((_, i) => {
    const day = addDays(weekStart, i % 7);
    return {
      id: `s${i}`,
      date: day.toISOString(),
      durationMin: 25,
      taskTitle: "Benchmarking",
    };
  });

  it("getWeeklyFocus performance with 10k sessions", () => {
    const start = performance.now();
    const result = getWeeklyFocus(largeSessions, now);
    const end = performance.now();
    const duration = end - start;

    console.log(`getWeeklyFocus with 10k sessions took: ${duration.toFixed(2)}ms`);
    expect(result).toHaveLength(7);
    // 10000 / 7 = ~1428 sessions per day. 1428 * 25 = 35700ish
    // Since i%7 covers all days equally:
    // Day 0: 1429 sessions (if 10000 % 7 != 0)
    // Actually 10000 / 7 = 1428.57
    expect(result[0].minutes).toBeGreaterThan(0);
  });

  it("getWeeklyFocusTotal performance with 10k sessions", () => {
    const start = performance.now();
    const result = getWeeklyFocusTotal(largeSessions, now);
    const end = performance.now();
    const duration = end - start;

    console.log(`getWeeklyFocusTotal with 10k sessions took: ${duration.toFixed(2)}ms`);
    expect(result).toBe(10000 * 25);
  });
});
