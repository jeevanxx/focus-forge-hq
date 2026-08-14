import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { startOfWeek, addDays, format } from "date-fns";

describe("getWeeklyFocus performance & correctness", () => {
  it("calculates weekly focus minutes correctly", () => {
    const now = new Date("2025-03-10T12:00:00Z"); // A Monday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // 2025-03-10

    const mockSessions: FocusSession[] = [
      {
        id: "1",
        user_id: "user1",
        task_id: "t1",
        task_title: "Task 1",
        durationMin: 25,
        date: format(weekStart, "yyyy-MM-dd'T'10:00:00.000'Z'"),
        created_at: new Date().toISOString(),
      },
      {
        id: "2",
        user_id: "user1",
        task_id: "t2",
        task_title: "Task 2",
        durationMin: 45,
        date: format(weekStart, "yyyy-MM-dd'T'14:00:00.000'Z'"),
        created_at: new Date().toISOString(),
      },
      {
        id: "3",
        user_id: "user1",
        task_id: "t3",
        task_title: "Task 3",
        durationMin: 30,
        date: format(addDays(weekStart, 2), "yyyy-MM-dd'T'09:00:00.000'Z'"), // Wed
        created_at: new Date().toISOString(),
      },
      {
        id: "4",
        user_id: "user1",
        task_id: "t4",
        task_title: "Task 4",
        durationMin: 60,
        date: format(addDays(weekStart, 10), "yyyy-MM-dd'T'09:00:00.000'Z'"), // Out of current week
        created_at: new Date().toISOString(),
      },
    ];

    const result = getWeeklyFocus(mockSessions, now);

    expect(result).toHaveLength(7);
    expect(result[0]).toEqual({ day: "Mon", date: "2025-03-10", minutes: 70 });
    expect(result[1]).toEqual({ day: "Tue", date: "2025-03-11", minutes: 0 });
    expect(result[2]).toEqual({ day: "Wed", date: "2025-03-12", minutes: 30 });
    expect(result[3]).toEqual({ day: "Thu", date: "2025-03-13", minutes: 0 });
    expect(result[4]).toEqual({ day: "Fri", date: "2025-03-14", minutes: 0 });
    expect(result[5]).toEqual({ day: "Sat", date: "2025-03-15", minutes: 0 });
    expect(result[6]).toEqual({ day: "Sun", date: "2025-03-16", minutes: 0 });
  });

  it("benchmarks getWeeklyFocus with 14,000 focus sessions", { timeout: 20000 }, () => {
    const now = new Date("2025-03-10T12:00:00Z");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    const sessions: FocusSession[] = [];
    const totalSessions = 14000; // multiple of 14

    for (let i = 0; i < totalSessions; i++) {
      const dayOffset = i % 14; // half in current week (0-6), half outside (7-13)
      const sessionDate = addDays(weekStart, dayOffset);
      sessions.push({
        id: `s-${i}`,
        user_id: "user-1",
        task_id: `t-${i}`,
        task_title: `Task ${i}`,
        durationMin: 25,
        date: sessionDate.toISOString(),
        created_at: new Date().toISOString(),
      });
    }

    // Warm-up
    getWeeklyFocus(sessions, now);

    const start = performance.now();
    const runs = 20;
    let lastResult;
    for (let r = 0; r < runs; r++) {
      lastResult = getWeeklyFocus(sessions, now);
    }
    const duration = performance.now() - start;
    const avgMs = duration / runs;

    console.log(`[BENCHMARK] Average execution time for getWeeklyFocus: ${avgMs.toFixed(2)}ms`);

    expect(lastResult).toHaveLength(7);
    // 14,000 total sessions, 1,000 per dayOffset 0..13. Days 0-6 are in current week.
    expect(lastResult![0].minutes).toBe(1000 * 25);
  });
});
