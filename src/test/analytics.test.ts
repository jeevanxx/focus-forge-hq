import { describe, it, expect } from "vitest";
import { getWeeklyFocus, getWeeklyFocusTotal } from "@/lib/analytics";
import type { FocusSession } from "@/lib/mock-data";
import { parseISO, addDays, startOfWeek, endOfWeek } from "date-fns";

describe("Analytics Engine", () => {
  const now = new Date("2025-05-22T12:00:00Z"); // A Thursday
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday 2025-05-19

  const mockSessions: FocusSession[] = [
    // Monday
    { id: "s1", date: "2025-05-19T09:00:00Z", durationMin: 30 },
    // Monday (boundary - exactly at start of day)
    { id: "s2", date: "2025-05-19T00:00:00Z", durationMin: 15 },
    // Wednesday
    { id: "s3", date: "2025-05-21T14:00:00Z", durationMin: 45 },
    // Sunday (boundary - near end of day)
    { id: "s4", date: "2025-05-25T23:59:59Z", durationMin: 60 },
    // Outside: Previous Sunday
    { id: "s5", date: "2025-05-18T23:59:59Z", durationMin: 100 },
    // Outside: Next Monday
    { id: "s6", date: "2025-05-26T00:00:00Z", durationMin: 100 },
  ];

  it("getWeeklyFocus buckets sessions correctly into 7 days", () => {
    const result = getWeeklyFocus(mockSessions, now);

    expect(result).toHaveLength(7);

    // Mon: 30 + 15 = 45
    expect(result[0].minutes).toBe(45);
    expect(result[0].day).toBe("Mon");

    // Tue: 0
    expect(result[1].minutes).toBe(0);

    // Wed: 45
    expect(result[2].minutes).toBe(45);

    // Thu: 0
    expect(result[3].minutes).toBe(0);

    // Fri: 0
    expect(result[4].minutes).toBe(0);

    // Sat: 0
    expect(result[5].minutes).toBe(0);

    // Sun: 60
    expect(result[6].minutes).toBe(60);
  });

  it("getWeeklyFocusTotal sums all sessions within the week correctly", () => {
    const total = getWeeklyFocusTotal(mockSessions, now);
    // 30 + 15 + 45 + 60 = 150
    expect(total).toBe(150);
  });

  it("handles empty sessions array", () => {
    const result = getWeeklyFocus([], now);
    expect(result.every(d => d.minutes === 0)).toBe(true);
    expect(getWeeklyFocusTotal([], now)).toBe(0);
  });
});
