import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "@/lib/analytics";
import type { FocusSession } from "@/lib/types";
import { format, startOfWeek, addDays } from "date-fns";

describe("getWeeklyFocus performance & correctness", () => {
  it("correctly aggregates focus minutes for current week days", () => {
    const now = new Date("2025-05-14T12:00:00Z"); // Wednesday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monStr = format(addDays(weekStart, 0), "yyyy-MM-dd");
    const wedStr = format(addDays(weekStart, 2), "yyyy-MM-dd");

    const sessions: FocusSession[] = [
      { id: "1", durationMin: 25, date: `${monStr}T09:00:00Z` },
      { id: "2", durationMin: 50, date: `${monStr}T14:00:00Z` },
      { id: "3", durationMin: 30, date: `${wedStr}T10:00:00Z` },
    ];

    const weekly = getWeeklyFocus(sessions, now);
    expect(weekly).toHaveLength(7);

    const mon = weekly.find((w) => w.date === monStr);
    const wed = weekly.find((w) => w.date === wedStr);

    expect(mon?.minutes).toBe(75);
    expect(wed?.minutes).toBe(30);
  });

  it("benchmarks single-pass getWeeklyFocus speedup on a dataset of 14,000 sessions", () => {
    const now = new Date("2025-05-14T12:00:00Z");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 14,000 mock focus sessions
    // Using length = 14,000 (multiple of 14) so sessions are evenly distributed across calendar categories
    const mockSessions: FocusSession[] = Array.from({ length: 14000 }, (_, i) => {
      const dayOffset = i % 14; // Spread across 14 days
      const dateStr = format(addDays(weekStart, dayOffset), "yyyy-MM-dd");
      return {
        id: `s-${i}`,
        durationMin: 25,
        date: `${dateStr}T10:00:00.000Z`,
      };
    });

    // Warm-up call
    getWeeklyFocus(mockSessions, now);

    const runs = 20;
    const start = performance.now();
    for (let r = 0; r < runs; r++) {
      getWeeklyFocus(mockSessions, now);
    }
    const elapsedMs = performance.now() - start;
    const avgMsPerCall = elapsedMs / runs;

    // Single pass should comfortably complete 14k sessions in under 200ms per call on any environment
    expect(avgMsPerCall).toBeLessThan(200);
  });
});
