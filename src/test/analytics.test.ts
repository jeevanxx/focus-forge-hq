import { describe, it, expect } from "vitest";
import { getWeeklyFocus, getWeeklyFocusTotal } from "../lib/analytics";
import { startOfWeek, addDays, format } from "date-fns";

describe("Analytics Correctness", () => {
  const now = new Date("2024-05-22T12:00:00Z"); // A Wednesday
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday May 20

  const mockSessions = [
    { id: "1", date: "2024-05-20T10:00:00Z", durationMin: 30 }, // Mon
    { id: "2", date: "2024-05-21T15:00:00Z", durationMin: 45 }, // Tue
    { id: "3", date: "2024-05-22T09:00:00Z", durationMin: 60 }, // Wed
    { id: "4", date: "2024-05-26T23:59:59Z", durationMin: 15 }, // Sun
    { id: "5", date: "2024-05-19T23:59:59Z", durationMin: 100 }, // Last Sun (should be excluded)
    { id: "6", date: "2024-05-27T00:00:00Z", durationMin: 200 }, // Next Mon (should be excluded)
  ];

  it("getWeeklyFocus correctly buckets sessions", () => {
    const weekly = getWeeklyFocus(mockSessions as any, now);

    expect(weekly[0].minutes).toBe(30); // Mon
    expect(weekly[1].minutes).toBe(45); // Tue
    expect(weekly[2].minutes).toBe(60); // Wed
    expect(weekly[6].minutes).toBe(15); // Sun

    // Check dates
    expect(weekly[0].date).toBe("2024-05-20");
    expect(weekly[6].date).toBe("2024-05-26");
  });

  it("getWeeklyFocusTotal calculates correctly", () => {
    const total = getWeeklyFocusTotal(mockSessions as any, now);
    expect(total).toBe(30 + 45 + 60 + 15);
  });
});
