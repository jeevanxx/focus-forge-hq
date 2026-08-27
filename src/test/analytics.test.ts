import { describe, it, expect } from "vitest";
import { getWeeklyFocus, getWeeklyFocusTotal } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { startOfWeek, addDays, format } from "date-fns";

describe("analytics - getWeeklyFocus", () => {
  it("correctly aggregates focus session minutes for the current week", () => {
    const now = new Date("2025-02-17T12:00:00Z"); // Monday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monDate = format(addDays(weekStart, 0), "yyyy-MM-dd");
    const wedDate = format(addDays(weekStart, 2), "yyyy-MM-dd");

    const mockSessions: FocusSession[] = [
      {
        id: "1",
        user_id: "user1",
        date: `${monDate}T09:00:00Z`,
        durationMin: 30,
        createdAt: `${monDate}T09:00:00Z`,
      },
      {
        id: "2",
        user_id: "user1",
        date: `${monDate}T14:00:00Z`,
        durationMin: 45,
        createdAt: `${monDate}T14:00:00Z`,
      },
      {
        id: "3",
        user_id: "user1",
        date: `${wedDate}T10:00:00Z`,
        durationMin: 60,
        createdAt: `${wedDate}T10:00:00Z`,
      },
      {
        id: "4",
        user_id: "user1",
        date: "2025-01-01T10:00:00Z", // Outside current week
        durationMin: 120,
        createdAt: "2025-01-01T10:00:00Z",
      },
    ];

    const weekly = getWeeklyFocus(mockSessions, now);
    expect(weekly).toHaveLength(7);
    expect(weekly[0]).toEqual({ day: "Mon", date: monDate, minutes: 75 });
    expect(weekly[1].minutes).toBe(0);
    expect(weekly[2]).toEqual({ day: "Wed", date: wedDate, minutes: 60 });
    expect(getWeeklyFocusTotal(mockSessions, now)).toBe(135);
  });

  it("handles empty session array gracefully", () => {
    const now = new Date("2025-02-17T12:00:00Z");
    const weekly = getWeeklyFocus([], now);
    expect(weekly).toHaveLength(7);
    expect(weekly.every((d) => d.minutes === 0)).toBe(true);
    expect(getWeeklyFocusTotal([], now)).toBe(0);
  });

  it("performance benchmark for getWeeklyFocus with large session array", { timeout: 20000 }, () => {
    const now = new Date("2025-02-17T12:00:00Z");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const sessions: FocusSession[] = [];

    // Generate 14,000 sessions distributed over 14 days
    for (let i = 0; i < 14000; i++) {
      const dayOffset = i % 14;
      const sessionDate = format(addDays(weekStart, dayOffset), "yyyy-MM-dd");
      sessions.push({
        id: `sess-${i}`,
        user_id: "user1",
        date: `${sessionDate}T10:00:00Z`,
        durationMin: 25,
        createdAt: `${sessionDate}T10:00:00Z`,
      });
    }

    // Warm up call
    getWeeklyFocus(sessions, now);

    const start = performance.now();
    const runs = 20;
    for (let r = 0; r < runs; r++) {
      getWeeklyFocus(sessions, now);
    }
    const end = performance.now();
    const avgMs = (end - start) / runs;
    console.log(`Average getWeeklyFocus execution time over ${runs} runs (14,000 sessions): ${avgMs.toFixed(2)}ms`);

    expect(avgMs).toBeLessThan(500);
  });
});
