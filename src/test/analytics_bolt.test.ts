import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "@/lib/analytics";
import type { FocusSession } from "@/lib/types";
import { startOfWeek, addDays, format } from "date-fns";

describe("getWeeklyFocus performance & correctness", () => {
  const now = new Date(2025, 2, 10, 12, 0, 0); // Monday, March 10, 2025
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });

  it("calculates weekly focus minutes correctly across days", () => {
    const mondayDate = format(weekStart, "yyyy-MM-dd");
    const tuesdayDate = format(addDays(weekStart, 1), "yyyy-MM-dd");
    const wednesdayDate = format(addDays(weekStart, 2), "yyyy-MM-dd");

    const sessions: FocusSession[] = [
      { id: "1", date: `${mondayDate}T09:00:00Z`, durationMin: 25, completed: true },
      { id: "2", date: `${mondayDate}T14:00:00Z`, durationMin: 50, completed: true },
      { id: "3", date: `${tuesdayDate}T10:00:00Z`, durationMin: 30, completed: true },
      { id: "4", date: `${wednesdayDate}T11:00:00Z`, durationMin: 45, completed: true },
      { id: "5", date: "2024-01-01T00:00:00Z", durationMin: 60, completed: true }, // outside current week
    ];

    const result = getWeeklyFocus(sessions, now);

    expect(result).toHaveLength(7);
    expect(result[0].minutes).toBe(75); // Mon (25 + 50)
    expect(result[1].minutes).toBe(30); // Tue (30)
    expect(result[2].minutes).toBe(45); // Wed (45)
    expect(result[3].minutes).toBe(0);  // Thu
    expect(result[4].minutes).toBe(0);  // Fri
    expect(result[5].minutes).toBe(0);  // Sat
    expect(result[6].minutes).toBe(0);  // Sun
  });

  it("executes single-pass aggregation efficiently over 14,000 sessions", () => {
    // Generate a large set of focus sessions (14,000 sessions)
    const sessions: FocusSession[] = [];
    const numSessions = 14000;

    for (let i = 0; i < numSessions; i++) {
      // Modulo distribution across 14 calendar days (7 within target week, 7 outside)
      const dayOffset = i % 14;
      const date = format(addDays(weekStart, dayOffset - 3), "yyyy-MM-dd");
      sessions.push({
        id: `session-${i}`,
        date: `${date}T10:00:00.000Z`,
        durationMin: 25,
        completed: true,
      });
    }

    // Warm up
    getWeeklyFocus(sessions, now);

    const start = performance.now();
    const runs = 20;
    for (let i = 0; i < runs; i++) {
      getWeeklyFocus(sessions, now);
    }
    const totalTimeMs = performance.now() - start;
    const avgTimeMs = totalTimeMs / runs;

    // With 14,000 sessions, O(N) execution should be fast (< 200ms)
    expect(avgTimeMs).toBeLessThan(200);

    // Verify result aggregation correctness
    const result = getWeeklyFocus(sessions, now);
    const totalWeekMinutes = result.reduce((sum, d) => sum + d.minutes, 0);
    // 7 days in week out of 14 days = 1/2 of 14,000 sessions = 7,000 sessions * 25 mins = 175,000 mins
    expect(totalWeekMinutes).toBe(175000);
  });
});
