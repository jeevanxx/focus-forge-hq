import { describe, it, expect } from "vitest";
import { getWeeklyFocus, getWeeklyFocusTotal } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { addDays, format, startOfWeek } from "date-fns";

describe("analytics - getWeeklyFocus", () => {
  it("correctly buckets focus sessions by day of the week", () => {
    const fixedNow = new Date("2025-01-15T12:00:00Z"); // Wednesday
    const weekStart = startOfWeek(fixedNow, { weekStartsOn: 1 }); // Monday 2025-01-13

    const monDate = format(addDays(weekStart, 0), "yyyy-MM-dd");
    const wedDate = format(addDays(weekStart, 2), "yyyy-MM-dd");
    const sunDate = format(addDays(weekStart, 6), "yyyy-MM-dd");

    const mockSessions: FocusSession[] = [
      { id: "1", date: `${monDate}T09:00:00.000Z`, durationMin: 45, mode: "focus", completed: true, createdAt: `${monDate}T09:00:00.000Z` },
      { id: "2", date: `${monDate}T14:00:00.000Z`, durationMin: 30, mode: "focus", completed: true, createdAt: `${monDate}T14:00:00.000Z` },
      { id: "3", date: `${wedDate}T10:00:00.000Z`, durationMin: 60, mode: "focus", completed: true, createdAt: `${wedDate}T10:00:00.000Z` },
      { id: "4", date: `${sunDate}T18:00:00.000Z`, durationMin: 25, mode: "focus", completed: true, createdAt: `${sunDate}T18:00:00.000Z` },
    ];

    const weekly = getWeeklyFocus(mockSessions, fixedNow);

    expect(weekly).toHaveLength(7);
    expect(weekly[0]).toEqual({ day: "Mon", date: monDate, minutes: 75 });
    expect(weekly[1]).toEqual({ day: "Tue", date: format(addDays(weekStart, 1), "yyyy-MM-dd"), minutes: 0 });
    expect(weekly[2]).toEqual({ day: "Wed", date: wedDate, minutes: 60 });
    expect(weekly[6]).toEqual({ day: "Sun", date: sunDate, minutes: 25 });

    const total = getWeeklyFocusTotal(mockSessions, fixedNow);
    expect(total).toBe(160);
  });

  it("handles empty focus session list", () => {
    const fixedNow = new Date("2025-01-15T12:00:00Z");
    const weekly = getWeeklyFocus([], fixedNow);
    expect(weekly).toHaveLength(7);
    expect(weekly.every((d) => d.minutes === 0)).toBe(true);
    expect(getWeeklyFocusTotal([], fixedNow)).toBe(0);
  });

  it("performs fast single-pass lookup on large session dataset (14,000 sessions)", () => {
    const fixedNow = new Date("2025-01-15T12:00:00Z");
    const weekStart = startOfWeek(fixedNow, { weekStartsOn: 1 });

    // Generate 14,000 focus sessions distributed across 14 days (multiple of 14 base)
    const largeSessions: FocusSession[] = Array.from({ length: 14000 }, (_, i) => {
      const dayOffset = i % 14; // 14 days spread
      const sessionDate = format(addDays(weekStart, dayOffset), "yyyy-MM-dd");
      return {
        id: `session-${i}`,
        date: `${sessionDate}T10:00:00.000Z`,
        durationMin: 20,
        mode: "focus",
        completed: true,
        createdAt: `${sessionDate}T10:00:00.000Z`,
      };
    });

    // Warm up call
    getWeeklyFocus(largeSessions, fixedNow);

    const start = performance.now();
    const result = getWeeklyFocus(largeSessions, fixedNow);
    const duration = performance.now() - start;

    expect(result).toHaveLength(7);
    // 14,000 / 14 = 1,000 sessions per day. Each day in the current week (7 days) has 1,000 sessions * 20 min = 20,000 min
    expect(result[0].minutes).toBe(20000);
    expect(duration).toBeLessThan(200); // Expect execution well under 200ms
  }, 20000);
});
