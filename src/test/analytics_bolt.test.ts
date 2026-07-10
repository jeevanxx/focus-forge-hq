import { describe, it, expect } from "vitest";
import { getWeeklyFocus, getWeeklyFocusTotal } from "../lib/analytics";
import { FocusSession } from "../lib/mock-data";
import { startOfWeek, addDays, format } from "date-fns";

describe("analytics focus calculations", () => {
  const now = new Date("2024-05-22T12:00:00Z"); // Wednesday
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday 2024-05-20

  const sessions: FocusSession[] = [
    {
      id: "s1",
      date: new Date("2024-05-20T10:00:00Z").toISOString(), // Monday
      durationMin: 30,
    },
    {
      id: "s2",
      date: new Date("2024-05-21T14:00:00Z").toISOString(), // Tuesday
      durationMin: 45,
    },
    {
      id: "s3",
      date: new Date("2024-05-26T09:00:00Z").toISOString(), // Sunday
      durationMin: 60,
    },
    {
      id: "s4",
      date: new Date("2024-05-19T23:00:00Z").toISOString(), // Previous Sunday
      durationMin: 25,
    },
    {
      id: "s5",
      date: new Date("2024-05-27T08:00:00Z").toISOString(), // Next Monday
      durationMin: 15,
    },
  ];

  it("getWeeklyFocus should correctly aggregate minutes for the current week", () => {
    const weekly = getWeeklyFocus(sessions, now);

    expect(weekly).toHaveLength(7);
    expect(weekly[0].minutes).toBe(30); // Mon
    expect(weekly[1].minutes).toBe(45); // Tue
    expect(weekly[2].minutes).toBe(0);  // Wed
    expect(weekly[6].minutes).toBe(60); // Sun

    expect(weekly[0].date).toBe("2024-05-20");
    expect(weekly[6].date).toBe("2024-05-26");
  });

  it("getWeeklyFocusTotal should correctly calculate total minutes for the current week", () => {
    const total = getWeeklyFocusTotal(sessions, now);
    expect(total).toBe(30 + 45 + 60);
  });
});
