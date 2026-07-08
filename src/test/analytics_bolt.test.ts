import { describe, it, expect } from "vitest";
import { getWeeklyFocus, getWeeklyFocusTotal } from "@/lib/analytics";
import { FocusSession } from "@/lib/mock-data";
import { parseISO, startOfWeek, addDays, format } from "date-fns";

describe("Analytics Regression Tests", () => {
  const now = new Date("2024-05-22T12:00:00Z"); // A Wednesday
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday May 20

  const mockSessions: FocusSession[] = [
    {
      id: "s1",
      date: addDays(weekStart, 0).toISOString(), // Mon
      durationMin: 30,
    },
    {
      id: "s2",
      date: addDays(weekStart, 0).toISOString(), // Mon
      durationMin: 45,
    },
    {
      id: "s3",
      date: addDays(weekStart, 2).toISOString(), // Wed
      durationMin: 60,
    },
    {
      id: "s4",
      date: addDays(weekStart, 6).toISOString(), // Sun
      durationMin: 15,
    },
    {
      id: "s5",
      date: addDays(weekStart, -1).toISOString(), // Last Sun (should be excluded)
      durationMin: 100,
    },
    {
      id: "s6",
      date: addDays(weekStart, 7).toISOString(), // Next Mon (should be excluded)
      durationMin: 100,
    },
  ];

  it("getWeeklyFocus correctly buckets sessions for the current week", () => {
    const weekly = getWeeklyFocus(mockSessions, now);

    expect(weekly).toHaveLength(7);

    // Monday
    expect(weekly[0].day).toBe("Mon");
    expect(weekly[0].minutes).toBe(75);
    expect(weekly[0].date).toBe(format(weekStart, "yyyy-MM-dd"));

    // Tuesday
    expect(weekly[1].day).toBe("Tue");
    expect(weekly[1].minutes).toBe(0);

    // Wednesday
    expect(weekly[2].day).toBe("Wed");
    expect(weekly[2].minutes).toBe(60);

    // Sunday
    expect(weekly[6].day).toBe("Sun");
    expect(weekly[6].minutes).toBe(15);
  });

  it("getWeeklyFocusTotal correctly sums all minutes for the current week", () => {
    const total = getWeeklyFocusTotal(mockSessions, now);
    expect(total).toBe(75 + 0 + 60 + 0 + 0 + 0 + 15);
  });
});
