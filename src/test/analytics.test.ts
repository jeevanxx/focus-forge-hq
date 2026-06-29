import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import { FocusSession } from "../lib/mock-data";
import { startOfWeek, addDays, format, subDays } from "date-fns";

describe("getWeeklyFocus", () => {
  it("correctly groups sessions by day of week", () => {
    const now = new Date("2024-05-22T12:00:00"); // A Wednesday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday May 20

    const sessions: FocusSession[] = [
      { id: "1", date: format(weekStart, "yyyy-MM-dd") + "T10:00:00", durationMin: 30 }, // Monday
      { id: "2", date: format(addDays(weekStart, 2), "yyyy-MM-dd") + "T15:00:00", durationMin: 45 }, // Wednesday
      { id: "3", date: format(addDays(weekStart, 2), "yyyy-MM-dd") + "T16:00:00", durationMin: 15 }, // Wednesday
      { id: "4", date: format(subDays(weekStart, 1), "yyyy-MM-dd") + "T10:00:00", durationMin: 60 }, // Last week Sunday (should be ignored)
      { id: "5", date: format(addDays(weekStart, 7), "yyyy-MM-dd") + "T10:00:00", durationMin: 60 }, // Next week Monday (should be ignored)
    ];

    const result = getWeeklyFocus(sessions, now);

    expect(result).toHaveLength(7);
    expect(result[0].minutes).toBe(30); // Mon
    expect(result[1].minutes).toBe(0);  // Tue
    expect(result[2].minutes).toBe(60); // Wed
    expect(result[3].minutes).toBe(0);  // Thu
    expect(result[4].minutes).toBe(0);  // Fri
    expect(result[5].minutes).toBe(0);  // Sat
    expect(result[6].minutes).toBe(0);  // Sun
  });

  it("handles boundary conditions (start and end of week)", () => {
    const now = new Date("2024-05-22T12:00:00");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);

    const sessions: FocusSession[] = [
      { id: "1", date: format(weekStart, "yyyy-MM-dd") + "T00:00:00", durationMin: 10 },
      { id: "2", date: format(weekEnd, "yyyy-MM-dd") + "T23:59:59", durationMin: 20 },
    ];

    const result = getWeeklyFocus(sessions, now);
    expect(result[0].minutes).toBe(10);
    expect(result[6].minutes).toBe(20);
  });
});
