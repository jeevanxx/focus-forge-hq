import { describe, it, expect } from "vitest";
import { getWeeklyFocus, getWeeklyFocusTotal } from "../lib/analytics";
import { FocusSession } from "../lib/mock-data";
import { addDays, startOfWeek, format } from "date-fns";

describe("analytics", () => {
  const now = new Date("2024-05-20T12:00:00Z"); // A Monday
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });

  const sessions: FocusSession[] = [
    { id: "1", date: weekStart.toISOString(), durationMin: 30 },
    { id: "2", date: addDays(weekStart, 1).toISOString(), durationMin: 45 },
    { id: "3", date: addDays(weekStart, 1).toISOString(), durationMin: 15 },
    { id: "4", date: addDays(weekStart, 7).toISOString(), durationMin: 60 }, // Next week
  ];

  it("getWeeklyFocus should correctly aggregate sessions by day", () => {
    const result = getWeeklyFocus(sessions, now);
    expect(result).toHaveLength(7);
    expect(result[0].minutes).toBe(30); // Mon
    expect(result[1].minutes).toBe(60); // Tue (45 + 15)
    expect(result[2].minutes).toBe(0);  // Wed
    expect(result[6].minutes).toBe(0);  // Sun
  });

  it("getWeeklyFocusTotal should correctly sum weekly minutes", () => {
    const result = getWeeklyFocusTotal(sessions, now);
    expect(result).toBe(90);
  });
});
