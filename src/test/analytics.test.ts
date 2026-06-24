
import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import { FocusSession } from "../lib/mock-data";
import { startOfWeek, addDays, format } from "date-fns";

describe("getWeeklyFocus", () => {
  it("should correctly aggregate session minutes by day", () => {
    const now = new Date("2024-05-22T12:00:00Z"); // A Wednesday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday May 20

    const sessions: FocusSession[] = [
      { id: "s1", date: format(weekStart, "yyyy-MM-dd'T'10:00:00"), durationMin: 25 },
      { id: "s2", date: format(weekStart, "yyyy-MM-dd'T'14:00:00"), durationMin: 30 },
      { id: "s3", date: format(addDays(weekStart, 1), "yyyy-MM-dd'T'09:00:00"), durationMin: 60 },
      { id: "s4", date: format(addDays(weekStart, 6), "yyyy-MM-dd'T'23:00:00"), durationMin: 15 },
      // Session outside this week
      { id: "s5", date: format(addDays(weekStart, -1), "yyyy-MM-dd'T'23:00:00"), durationMin: 100 },
      { id: "s6", date: format(addDays(weekStart, 7), "yyyy-MM-dd'T'01:00:00"), durationMin: 100 },
    ];

    const result = getWeeklyFocus(sessions, now);

    expect(result).toHaveLength(7);
    expect(result[0].minutes).toBe(55); // Mon
    expect(result[1].minutes).toBe(60); // Tue
    expect(result[2].minutes).toBe(0);  // Wed
    expect(result[3].minutes).toBe(0);  // Thu
    expect(result[4].minutes).toBe(0);  // Fri
    expect(result[5].minutes).toBe(0);  // Sat
    expect(result[6].minutes).toBe(15); // Sun
  });
});
