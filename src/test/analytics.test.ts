
import { describe, it, expect } from "vitest";
import { getWeeklyFocus, getWeeklyFocusTotal } from "../lib/analytics";
import { FocusSession } from "../lib/mock-data";
import { startOfWeek, addDays, format } from "date-fns";

describe("analytics", () => {
  const now = new Date("2024-05-22T12:00:00Z"); // A Wednesday
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday 2024-05-20

  const sessions: FocusSession[] = [
    { id: "1", date: "2024-05-20T10:00:00Z", durationMin: 30 }, // Mon
    { id: "2", date: "2024-05-20T14:00:00Z", durationMin: 45 }, // Mon
    { id: "3", date: "2024-05-21T09:00:00Z", durationMin: 60 }, // Tue
    { id: "4", date: "2024-05-26T20:00:00Z", durationMin: 20 }, // Sun
    { id: "5", date: "2024-05-19T23:59:00Z", durationMin: 100 }, // Prev Sun (out)
    { id: "6", date: "2024-05-27T00:01:00Z", durationMin: 100 }, // Next Mon (out)
  ];

  it("getWeeklyFocus correctly buckets sessions", () => {
    const weekly = getWeeklyFocus(sessions, now);
    expect(weekly).toHaveLength(7);
    expect(weekly[0].minutes).toBe(75); // Mon
    expect(weekly[1].minutes).toBe(60); // Tue
    expect(weekly[2].minutes).toBe(0);  // Wed
    expect(weekly[6].minutes).toBe(20); // Sun
  });

  it("getWeeklyFocusTotal correctly sums sessions", () => {
    const total = getWeeklyFocusTotal(sessions, now);
    expect(total).toBe(75 + 60 + 20);
  });
});
