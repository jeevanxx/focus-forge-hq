import { describe, it, expect } from "vitest";
import { getWeeklyFocus, getWeeklyFocusTotal } from "../lib/analytics";
import { FocusSession } from "../lib/mock-data";
import { startOfWeek, addDays, format } from "date-fns";

describe("analytics lib", () => {
  const now = new Date("2024-05-22T12:00:00Z"); // A Wednesday
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });

  it("getWeeklyFocus correctly buckets sessions", () => {
    const sessions: FocusSession[] = [
      {
        id: "1",
        date: addDays(weekStart, 0).toISOString(), // Mon
        durationMin: 30,
      },
      {
        id: "2",
        date: addDays(weekStart, 0).toISOString(), // Mon
        durationMin: 15,
      },
      {
        id: "3",
        date: addDays(weekStart, 2).toISOString(), // Wed
        durationMin: 45,
      },
      {
        id: "4",
        date: addDays(weekStart, 6).toISOString(), // Sun
        durationMin: 60,
      },
      {
        id: "5",
        date: addDays(weekStart, -1).toISOString(), // Previous week Sun (should be excluded)
        durationMin: 100,
      },
      {
        id: "6",
        date: addDays(weekStart, 7).toISOString(), // Next week Mon (should be excluded)
        durationMin: 100,
      },
    ];

    const result = getWeeklyFocus(sessions, now);

    expect(result).toHaveLength(7);
    expect(result[0].minutes).toBe(45); // Mon
    expect(result[1].minutes).toBe(0);  // Tue
    expect(result[2].minutes).toBe(45); // Wed
    expect(result[6].minutes).toBe(60); // Sun

    expect(result[0].date).toBe(format(addDays(weekStart, 0), "yyyy-MM-dd"));
  });

  it("getWeeklyFocusTotal calculates correctly", () => {
    const sessions: FocusSession[] = [
        { id: "1", date: addDays(weekStart, 0).toISOString(), durationMin: 30 },
        { id: "2", date: addDays(weekStart, 2).toISOString(), durationMin: 45 },
    ];
    expect(getWeeklyFocusTotal(sessions, now)).toBe(75);
  });
});
