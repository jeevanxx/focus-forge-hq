import { describe, it, expect } from "vitest";
import { getWeeklyFocus, getWeeklyFocusTotal } from "../lib/analytics";
import type { FocusSession } from "../lib/types";

describe("getWeeklyFocus benchmark & correctness", () => {
  it("calculates weekly focus correctly and measures performance with 14,000 sessions", () => {
    // Generate 14,000 sessions evenly distributed over 14 days
    const sessions: FocusSession[] = [];
    const baseDate = new Date("2025-01-01T10:00:00Z"); // Wednesday Jan 1, 2025

    for (let i = 0; i < 14000; i++) {
      const d = new Date(baseDate.getTime() + (i % 14) * 24 * 60 * 60 * 1000);
      sessions.push({
        id: `session-${i}`,
        date: d.toISOString(),
        durationMin: 25,
        completed: true,
      });
    }

    // Reference now date: Jan 5, 2025 (Sunday). Week start: Mon Dec 30, 2024 - Sun Jan 5, 2025.
    const now = new Date("2025-01-05T12:00:00Z");

    // Correctness assertion
    const result = getWeeklyFocus(sessions, now);
    expect(result.length).toBe(7);

    // Wed Jan 1, Thu Jan 2, Fri Jan 3, Sat Jan 4, Sun Jan 5 are in week Dec 30 - Jan 5.
    // 14,000 / 14 = 1,000 sessions per day. 1,000 * 25 = 25,000 minutes per day for active days.
    const wed = result.find((r) => r.day === "Wed");
    expect(wed?.minutes).toBe(25000);

    // Warm-up
    getWeeklyFocus(sessions, now);

    const start = performance.now();
    const runs = 20;
    for (let r = 0; r < runs; r++) {
      getWeeklyFocus(sessions, now);
    }
    const end = performance.now();
    const avgTimeMs = (end - start) / runs;
    console.log(`Average getWeeklyFocus execution time over ${runs} runs (14k items): ${avgTimeMs.toFixed(2)} ms`);
  }, 30000);
});
