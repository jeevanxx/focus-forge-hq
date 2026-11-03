import { describe, it, expect } from "vitest";
import { getWeeklyFocus, getWeeklyFocusTotal } from "@/lib/analytics";
import type { FocusSession } from "@/lib/types";

describe("Analytics module - getWeeklyFocus", () => {
  it("correctly calculates weekly focus per day and total", () => {
    const now = new Date("2025-01-08T12:00:00Z"); // Wednesday
    // Week start (Mon 2025-01-06)
    const sessions: FocusSession[] = [
      {
        id: "s1",
        user_id: "u1",
        date: "2025-01-06T09:00:00Z", // Mon
        durationMin: 30,
        completed: true,
        created_at: "2025-01-06T09:00:00Z",
      },
      {
        id: "s2",
        user_id: "u1",
        date: "2025-01-06T14:00:00Z", // Mon
        durationMin: 45,
        completed: true,
        created_at: "2025-01-06T14:00:00Z",
      },
      {
        id: "s3",
        user_id: "u1",
        date: "2025-01-08T10:00:00Z", // Wed
        durationMin: 60,
        completed: true,
        created_at: "2025-01-08T10:00:00Z",
      },
      {
        id: "s4",
        user_id: "u1",
        date: "2025-01-15T10:00:00Z", // Next week, out of range
        durationMin: 120,
        completed: true,
        created_at: "2025-01-15T10:00:00Z",
      },
    ];

    const weekly = getWeeklyFocus(sessions, now);
    expect(weekly).toHaveLength(7);
    expect(weekly[0]).toEqual({ day: "Mon", date: "2025-01-06", minutes: 75 });
    expect(weekly[1]).toEqual({ day: "Tue", date: "2025-01-07", minutes: 0 });
    expect(weekly[2]).toEqual({ day: "Wed", date: "2025-01-08", minutes: 60 });

    const total = getWeeklyFocusTotal(sessions, now);
    expect(total).toBe(135);
  });

  it("benchmarks performance speedup on large datasets", () => {
    const baseDate = new Date("2025-01-01T10:00:00Z");
    const sessions: FocusSession[] = [];
    for (let i = 0; i < 14000; i++) {
      const d = new Date(baseDate.getTime() + (i % 14) * 86400000);
      sessions.push({
        id: `s-${i}`,
        user_id: "u-1",
        date: d.toISOString(),
        durationMin: 25,
        completed: true,
        created_at: d.toISOString(),
      });
    }

    // Warm-up
    getWeeklyFocus(sessions, baseDate);

    const start = performance.now();
    for (let i = 0; i < 10; i++) {
      getWeeklyFocus(sessions, baseDate);
    }
    const duration = performance.now() - start;
    console.log(`Optimized getWeeklyFocus (10 calls x 14k sessions): ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(2000);
  });
});
