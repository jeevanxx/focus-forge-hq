import { describe, test, expect } from "vitest";
import { getWeeklyFocus } from "@/lib/analytics";
import type { FocusSession } from "@/lib/types";

describe("getWeeklyFocus", () => {
  test("returns 7 days starting from Monday for the given week", () => {
    const now = new Date("2025-05-15T12:00:00Z"); // Thursday
    const sessions: FocusSession[] = [
      {
        id: "1",
        user_id: "u1",
        task_id: "t1",
        durationMin: 30,
        date: "2025-05-12T10:00:00Z", // Monday of this week
        created_at: "2025-05-12T10:00:00Z",
      },
      {
        id: "2",
        user_id: "u1",
        task_id: "t2",
        durationMin: 45,
        date: "2025-05-12T14:00:00Z", // Monday of this week
        created_at: "2025-05-12T14:00:00Z",
      },
      {
        id: "3",
        user_id: "u1",
        task_id: "t3",
        durationMin: 25,
        date: "2025-05-15T09:00:00Z", // Thursday of this week
        created_at: "2025-05-15T09:00:00Z",
      },
      {
        id: "4",
        user_id: "u1",
        task_id: "t4",
        durationMin: 60,
        date: "2025-05-01T10:00:00Z", // Outside current week
        created_at: "2025-05-01T10:00:00Z",
      },
    ];

    const weekly = getWeeklyFocus(sessions, now);

    expect(weekly).toHaveLength(7);
    expect(weekly.map((w) => w.day)).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    expect(weekly[0]).toEqual({ day: "Mon", date: "2025-05-12", minutes: 75 });
    expect(weekly[3]).toEqual({ day: "Thu", date: "2025-05-15", minutes: 25 });
    expect(weekly[1].minutes).toBe(0); // Tuesday
  });

  test("handles empty sessions array cleanly", () => {
    const now = new Date("2025-05-15T12:00:00Z");
    const weekly = getWeeklyFocus([], now);
    expect(weekly).toHaveLength(7);
    weekly.forEach((day) => {
      expect(day.minutes).toBe(0);
    });
  });

  test("executes efficiently over large session datasets (O(N) performance)", () => {
    const now = new Date("2025-05-15T12:00:00Z");
    const sessions: FocusSession[] = [];
    const baseTime = now.getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    // Generate 14,000 sessions (multiple of 14 for even distribution)
    for (let i = 0; i < 14000; i++) {
      const dayOffset = i % 14;
      const dateObj = new Date(baseTime - dayOffset * dayMs);
      sessions.push({
        id: `session-${i}`,
        user_id: "u1",
        task_id: "t1",
        durationMin: 25,
        date: dateObj.toISOString(),
        created_at: dateObj.toISOString(),
      });
    }

    // Warmup call to avoid JIT overhead
    getWeeklyFocus(sessions, now);

    const start = performance.now();
    getWeeklyFocus(sessions, now);
    const elapsed = performance.now() - start;

    // Single call on 14,000 sessions should execute well under 200ms (typically ~100ms)
    expect(elapsed).toBeLessThan(200);
  }, 20000);
});
