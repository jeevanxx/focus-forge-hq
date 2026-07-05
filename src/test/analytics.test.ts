import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "@/lib/analytics";
import type { FocusSession } from "@/lib/mock-data";
import { format, addDays, startOfWeek } from "date-fns";

describe("getWeeklyFocus", () => {
  const now = new Date("2024-05-22T12:00:00Z"); // Wednesday
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday, May 20

  it("correctly buckets sessions into the current week", () => {
    const sessions: FocusSession[] = [
      { id: "1", taskTitle: "A", durationMin: 30, date: format(addDays(weekStart, 0), "yyyy-MM-dd'T'10:00:00") }, // Mon
      { id: "2", taskTitle: "B", durationMin: 45, date: format(addDays(weekStart, 0), "yyyy-MM-dd'T'14:00:00") }, // Mon
      { id: "3", taskTitle: "C", durationMin: 60, date: format(addDays(weekStart, 2), "yyyy-MM-dd'T'09:00:00") }, // Wed
      { id: "4", taskTitle: "D", durationMin: 20, date: format(addDays(weekStart, 6), "yyyy-MM-dd'T'20:00:00") }, // Sun
    ];

    const result = getWeeklyFocus(sessions, now);

    expect(result).toHaveLength(7);
    expect(result[0].minutes).toBe(75); // Mon
    expect(result[1].minutes).toBe(0);  // Tue
    expect(result[2].minutes).toBe(60); // Wed
    expect(result[6].minutes).toBe(20); // Sun
  });

  it("excludes sessions outside the current week", () => {
    const sessions: FocusSession[] = [
      { id: "1", taskTitle: "Prev", durationMin: 30, date: format(addDays(weekStart, -1), "yyyy-MM-dd'T'10:00:00") }, // Prev Sun
      { id: "2", taskTitle: "Next", durationMin: 30, date: format(addDays(weekStart, 7), "yyyy-MM-dd'T'10:00:00") }, // Next Mon
    ];

    const result = getWeeklyFocus(sessions, now);

    result.forEach(day => {
      expect(day.minutes).toBe(0);
    });
  });

  it("handles empty sessions array", () => {
    const result = getWeeklyFocus([], now);
    expect(result).toHaveLength(7);
    result.forEach(day => expect(day.minutes).toBe(0));
  });
});
