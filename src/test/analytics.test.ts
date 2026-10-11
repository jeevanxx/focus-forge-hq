import { describe, expect, it } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { addDays, format, startOfWeek } from "date-fns";

describe("getWeeklyFocus", () => {
  it("returns 0 minutes for all 7 days when sessions array is empty", () => {
    const now = new Date("2025-03-10T12:00:00.000Z"); // A Monday
    const result = getWeeklyFocus([], now);

    expect(result).toHaveLength(7);
    expect(result.every((d) => d.minutes === 0)).toBe(true);
    expect(result[0].day).toBe("Mon");
    expect(result[6].day).toBe("Sun");
  });

  it("correctly aggregates session durations per day for the current week", () => {
    const now = new Date("2025-03-10T12:00:00.000Z"); // Monday Mar 10, 2025
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    const monDate = format(weekStart, "yyyy-MM-dd");
    const wedDate = format(addDays(weekStart, 2), "yyyy-MM-dd");

    const sessions: FocusSession[] = [
      { id: "1", date: `${monDate}T09:00:00.000Z`, durationMin: 25 },
      { id: "2", date: `${monDate}T14:30:00.000Z`, durationMin: 50 },
      { id: "3", date: `${wedDate}T11:00:00.000Z`, durationMin: 30 },
      // Session outside the week
      { id: "4", date: "2025-01-01T10:00:00.000Z", durationMin: 60 },
    ];

    const result = getWeeklyFocus(sessions, now);

    expect(result).toHaveLength(7);
    expect(result[0].date).toBe(monDate);
    expect(result[0].minutes).toBe(75); // 25 + 50
    expect(result[2].date).toBe(wedDate);
    expect(result[2].minutes).toBe(30);
    expect(result[1].minutes).toBe(0); // Tue
  });

  it("handles large datasets efficiently", () => {
    const now = new Date("2025-03-10T12:00:00.000Z");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 14,000 sessions distributed across 14 days (7 days in week + 7 days out)
    const sessions: FocusSession[] = [];
    const totalSessions = 14000;

    for (let i = 0; i < totalSessions; i++) {
      const dayOffset = i % 14;
      const date = addDays(weekStart, dayOffset);
      sessions.push({
        id: `sess-${i}`,
        date: `${format(date, "yyyy-MM-dd")}T10:00:00.000Z`,
        durationMin: 10,
      });
    }

    // Warm up
    getWeeklyFocus(sessions, now);

    const start = performance.now();
    const result = getWeeklyFocus(sessions, now);
    const elapsed = performance.now() - start;

    expect(result).toHaveLength(7);
    // 1000 sessions per day * 10 mins = 10,000 mins per day
    expect(result[0].minutes).toBe(10000);
    expect(elapsed).toBeLessThan(500);
  });
});
