import { describe, it, expect } from "vitest";
import { getWeeklyFocus, getWeeklyFocusTotal } from "../lib/analytics";
import { FocusSession } from "../lib/mock-data";
import { startOfWeek, addDays, format, subDays } from "date-fns";

describe("Analytics - Weekly Focus", () => {
  const now = new Date("2024-05-22T12:00:00Z"); // A Wednesday
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday, 2024-05-20

  it("correctly buckets sessions by day of the week", () => {
    const sessions: FocusSession[] = [
      {
        id: "1",
        date: "2024-05-20T10:00:00Z", // Monday
        durationMin: 30,
      },
      {
        id: "2",
        date: "2024-05-20T15:00:00Z", // Monday
        durationMin: 45,
      },
      {
        id: "3",
        date: "2024-05-22T09:00:00Z", // Wednesday
        durationMin: 60,
      },
      {
        id: "4",
        date: "2024-05-26T23:59:59Z", // Sunday
        durationMin: 15,
      },
      {
        id: "5",
        date: "2024-05-19T23:59:59Z", // Previous Sunday
        durationMin: 100,
      },
      {
        id: "6",
        date: "2024-05-27T00:00:00Z", // Next Monday
        durationMin: 200,
      },
    ];

    const result = getWeeklyFocus(sessions, now);

    expect(result).toHaveLength(7);
    expect(result[0]).toEqual({ day: "Mon", date: "2024-05-20", minutes: 75 });
    expect(result[1]).toEqual({ day: "Tue", date: "2024-05-21", minutes: 0 });
    expect(result[2]).toEqual({ day: "Wed", date: "2024-05-22", minutes: 60 });
    expect(result[3]).toEqual({ day: "Thu", date: "2024-05-23", minutes: 0 });
    expect(result[4]).toEqual({ day: "Fri", date: "2024-05-24", minutes: 0 });
    expect(result[5]).toEqual({ day: "Sat", date: "2024-05-25", minutes: 0 });
    expect(result[6]).toEqual({ day: "Sun", date: "2024-05-26", minutes: 15 });
  });

  it("calculates total weekly focus correctly", () => {
    const sessions: FocusSession[] = [
      {
        id: "1",
        date: "2024-05-20T10:00:00Z", // Monday
        durationMin: 30,
      },
      {
        id: "3",
        date: "2024-05-22T09:00:00Z", // Wednesday
        durationMin: 60,
      },
      {
        id: "5",
        date: "2024-05-19T23:59:59Z", // Previous Sunday (outside)
        durationMin: 100,
      },
    ];

    const total = getWeeklyFocusTotal(sessions, now);
    expect(total).toBe(90);
  });
});
