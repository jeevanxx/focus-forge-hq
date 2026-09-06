import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { addDays, format, startOfWeek } from "date-fns";

describe("getWeeklyFocus", () => {
  it("correctly aggregates focus minutes for current week days", () => {
    const now = new Date("2025-01-15T12:00:00Z"); // Wednesday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday Jan 13

    const monDate = format(weekStart, "yyyy-MM-dd");
    const wedDate = format(addDays(weekStart, 2), "yyyy-MM-dd");

    const sessions: FocusSession[] = [
      {
        id: "1",
        userId: "user1",
        date: `${monDate}T09:00:00Z`,
        durationMin: 30,
        createdAt: `${monDate}T09:00:00Z`,
      },
      {
        id: "2",
        userId: "user1",
        date: `${monDate}T14:00:00Z`,
        durationMin: 45,
        createdAt: `${monDate}T14:00:00Z`,
      },
      {
        id: "3",
        userId: "user1",
        date: `${wedDate}T10:00:00Z`,
        durationMin: 60,
        createdAt: `${wedDate}T10:00:00Z`,
      },
      // Outside week session
      {
        id: "4",
        userId: "user1",
        date: "2025-01-01T10:00:00Z",
        durationMin: 120,
        createdAt: "2025-01-01T10:00:00Z",
      },
    ];

    const weekly = getWeeklyFocus(sessions, now);

    expect(weekly).toHaveLength(7);
    expect(weekly[0]).toEqual({ day: "Mon", date: monDate, minutes: 75 });
    expect(weekly[2]).toEqual({ day: "Wed", date: wedDate, minutes: 60 });
    expect(weekly[1].minutes).toBe(0);
  });

  it("benchmark: measures execution speed for 14,000 sessions", () => {
    const now = new Date("2025-01-15T12:00:00Z");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 14,000 sessions (a multiple of 14 for uniform distribution across 14 days)
    const sessions: FocusSession[] = [];
    for (let i = 0; i < 14000; i++) {
      const date = addDays(weekStart, (i % 14) - 3); // some inside week, some outside
      sessions.push({
        id: `sess-${i}`,
        userId: "u1",
        date: `${format(date, "yyyy-MM-dd")}T10:00:00Z`,
        durationMin: 25,
        createdAt: `${format(date, "yyyy-MM-dd")}T10:00:00Z`,
      });
    }

    // Warm-up call
    getWeeklyFocus(sessions, now);

    const start = performance.now();
    const runs = 20;
    for (let r = 0; r < runs; r++) {
      getWeeklyFocus(sessions, now);
    }
    const end = performance.now();

    const avgMs = (end - start) / runs;
    console.log(`Average getWeeklyFocus execution time over ${runs} runs: ${avgMs.toFixed(2)}ms`);

    expect(avgMs).toBeGreaterThan(0);
  }, 20000);
});
