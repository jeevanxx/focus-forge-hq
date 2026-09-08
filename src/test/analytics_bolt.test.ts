import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";

describe("getWeeklyFocus correctness & performance", () => {
  it("correctly aggregates focus minutes for current week days", () => {
    const now = new Date("2025-01-15T12:00:00Z"); // Wednesday
    // Week start (Monday) is 2025-01-13
    const sessions: FocusSession[] = [
      {
        id: "s1",
        user_id: "u1",
        task_id: null,
        durationMin: 30,
        date: "2025-01-13T10:00:00Z", // Monday
        created_at: "2025-01-13T10:00:00Z",
      },
      {
        id: "s2",
        user_id: "u1",
        task_id: null,
        durationMin: 45,
        date: "2025-01-13T14:00:00Z", // Monday
        created_at: "2025-01-13T14:00:00Z",
      },
      {
        id: "s3",
        user_id: "u1",
        task_id: null,
        durationMin: 25,
        date: "2025-01-15T09:00:00Z", // Wednesday
        created_at: "2025-01-15T09:00:00Z",
      },
      {
        id: "s4",
        user_id: "u1",
        task_id: null,
        durationMin: 60,
        date: "2025-01-20T09:00:00Z", // Next week Monday
        created_at: "2025-01-20T09:00:00Z",
      },
    ];

    const weekly = getWeeklyFocus(sessions, now);
    expect(weekly).toHaveLength(7);
    expect(weekly[0]).toEqual({ day: "Mon", date: "2025-01-13", minutes: 75 });
    expect(weekly[1]).toEqual({ day: "Tue", date: "2025-01-14", minutes: 0 });
    expect(weekly[2]).toEqual({ day: "Wed", date: "2025-01-15", minutes: 25 });
  });

  it("handles empty session array gracefully", () => {
    const now = new Date("2025-01-15T12:00:00Z");
    const weekly = getWeeklyFocus([], now);
    expect(weekly).toHaveLength(7);
    expect(weekly.every((d) => d.minutes === 0)).toBe(true);
  });

  it("measures performance on 14,000 sessions", () => {
    const sessions: FocusSession[] = [];
    const now = new Date("2025-01-15T12:00:00Z");
    // Generate 14,000 sessions distributed evenly over 14 days
    for (let i = 0; i < 14000; i++) {
      const d = new Date(now.getTime() - (i % 14) * 86400000);
      sessions.push({
        id: `session-${i}`,
        user_id: "user-1",
        task_id: null,
        durationMin: 25,
        date: d.toISOString(),
        created_at: d.toISOString(),
      });
    }

    // Warm up
    getWeeklyFocus(sessions, now);

    const start = performance.now();
    for (let run = 0; run < 10; run++) {
      getWeeklyFocus(sessions, now);
    }
    const duration = performance.now() - start;
    console.log(`10 runs on 14,000 sessions took: ${duration.toFixed(2)}ms`);

    const result = getWeeklyFocus(sessions, now);
    expect(result).toHaveLength(7);
  }, 20000);
});
