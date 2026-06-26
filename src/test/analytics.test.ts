import { describe, it, expect } from "vitest";
import { getWeeklyFocus, getWeeklyFocusTotal } from "../lib/analytics";
import { FocusSession } from "../lib/mock-data";
import { addDays, startOfWeek, format, parseISO } from "date-fns";

describe("analytics", () => {
  // Use a fixed "now" to make tests deterministic
  // 2025-05-22 is a Thursday
  const now = new Date("2025-05-22T12:00:00");
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday 2025-05-19

  it("getWeeklyFocus groups sessions by day correctly", () => {
    // We use date strings that will be parsed by parseISO and then formatted
    // to ensure they land on the expected days in the current environment's timezone.
    const sessions: FocusSession[] = [
      {
        id: "1",
        date: format(addDays(weekStart, 0), "yyyy-MM-dd") + "T10:00:00",
        durationMin: 30
      }, // Monday
      {
        id: "2",
        date: format(addDays(weekStart, 0), "yyyy-MM-dd") + "T15:00:00",
        durationMin: 20
      }, // Monday
      {
        id: "3",
        date: format(addDays(weekStart, 1), "yyyy-MM-dd") + "T09:00:00",
        durationMin: 45
      }, // Tuesday
      {
        id: "4",
        date: format(addDays(weekStart, 6), "yyyy-MM-dd") + "T23:59:59",
        durationMin: 60
      }, // Sunday
      {
        id: "5",
        date: format(addDays(weekStart, -1), "yyyy-MM-dd") + "T23:59:59",
        durationMin: 10
      }, // Previous Sunday (outside)
      {
        id: "6",
        date: format(addDays(weekStart, 7), "yyyy-MM-dd") + "T00:00:00",
        durationMin: 15
      }, // Next Monday (outside)
    ];

    const weekly = getWeeklyFocus(sessions, now);

    expect(weekly).toHaveLength(7);
    expect(weekly[0].day).toBe("Mon");
    expect(weekly[0].minutes).toBe(50);
    expect(weekly[1].day).toBe("Tue");
    expect(weekly[1].minutes).toBe(45);
    expect(weekly[2].day).toBe("Wed");
    expect(weekly[2].minutes).toBe(0);
    expect(weekly[6].day).toBe("Sun");
    expect(weekly[6].minutes).toBe(60);
  });

  it("getWeeklyFocusTotal calculates total minutes for the week correctly", () => {
    const sessions: FocusSession[] = [
      {
        id: "1",
        date: format(addDays(weekStart, 0), "yyyy-MM-dd") + "T10:00:00",
        durationMin: 30
      },
      {
        id: "2",
        date: format(addDays(weekStart, 1), "yyyy-MM-dd") + "T10:00:00",
        durationMin: 30
      },
      {
        id: "3",
        date: format(addDays(weekStart, -1), "yyyy-MM-dd") + "T10:00:00",
        durationMin: 30
      }, // outside
    ];

    const total = getWeeklyFocusTotal(sessions, now);
    expect(total).toBe(60);
  });
});
