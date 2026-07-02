import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import { FocusSession } from "../lib/mock-data";
import { startOfWeek, addDays, format } from "date-fns";

describe("getWeeklyFocus", () => {
  const now = new Date("2024-05-22T12:00:00Z"); // A Wednesday
  const monday = startOfWeek(now, { weekStartsOn: 1 });

  it("should return 7 days of focus data starting from Monday", () => {
    const result = getWeeklyFocus([], now);
    expect(result).toHaveLength(7);
    expect(result[0].day).toBe("Mon");
    expect(result[6].day).toBe("Sun");

    for (let i = 0; i < 7; i++) {
      const expectedDate = format(addDays(monday, i), "yyyy-MM-dd");
      expect(result[i].date).toBe(expectedDate);
      expect(result[i].minutes).toBe(0);
    }
  });

  it("should correctly aggregate session durations by day", () => {
    const sessions: FocusSession[] = [
      {
        id: "1",
        date: format(monday, "yyyy-MM-dd'T'10:00:00"),
        durationMin: 30,
      },
      {
        id: "2",
        date: format(monday, "yyyy-MM-dd'T'14:00:00"),
        durationMin: 45,
      },
      {
        id: "3",
        date: format(addDays(monday, 2), "yyyy-MM-dd'T'09:00:00"), // Wednesday
        durationMin: 60,
      },
      {
        id: "4",
        date: format(addDays(monday, 6), "yyyy-MM-dd'T'20:00:00"), // Sunday
        durationMin: 15,
      },
    ];

    const result = getWeeklyFocus(sessions, now);
    expect(result[0].minutes).toBe(75); // Monday: 30 + 45
    expect(result[1].minutes).toBe(0);  // Tuesday
    expect(result[2].minutes).toBe(60); // Wednesday
    expect(result[6].minutes).toBe(15); // Sunday
  });

  it("should ignore sessions outside the current week", () => {
    const sessions: FocusSession[] = [
      {
        id: "prev",
        date: format(addDays(monday, -1), "yyyy-MM-dd'T'12:00:00"), // Previous Sunday
        durationMin: 100,
      },
      {
        id: "next",
        date: format(addDays(monday, 7), "yyyy-MM-dd'T'12:00:00"), // Next Monday
        durationMin: 200,
      },
    ];

    const result = getWeeklyFocus(sessions, now);
    const totalMinutes = result.reduce((sum, d) => sum + d.minutes, 0);
    expect(totalMinutes).toBe(0);
  });
});
