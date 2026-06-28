import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import { FocusSession } from "../lib/mock-data";
import { addDays, startOfWeek, format } from "date-fns";

describe("getWeeklyFocus", () => {
  const now = new Date("2024-05-22T12:00:00Z"); // Wednesday
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // 2024-05-20 (Monday)

  it("should aggregate sessions correctly within the week", () => {
    const sessions: FocusSession[] = [
      { id: "1", date: addDays(weekStart, 0).toISOString(), durationMin: 30 }, // Mon
      { id: "2", date: addDays(weekStart, 0).toISOString(), durationMin: 20 }, // Mon
      { id: "3", date: addDays(weekStart, 2).toISOString(), durationMin: 50 }, // Wed
      { id: "4", date: addDays(weekStart, 6).toISOString(), durationMin: 10 }, // Sun
    ];

    const result = getWeeklyFocus(sessions, now);

    expect(result[0].minutes).toBe(50); // Mon
    expect(result[1].minutes).toBe(0);  // Tue
    expect(result[2].minutes).toBe(50); // Wed
    expect(result[6].minutes).toBe(10); // Sun
    expect(result.length).toBe(7);
  });

  it("should ignore sessions outside the current week", () => {
    const sessions: FocusSession[] = [
      { id: "1", date: addDays(weekStart, -1).toISOString(), durationMin: 30 }, // Prev Sun
      { id: "2", date: addDays(weekStart, 7).toISOString(), durationMin: 30 },  // Next Mon
    ];

    const result = getWeeklyFocus(sessions, now);

    result.forEach((day) => {
      expect(day.minutes).toBe(0);
    });
  });

  it("should return all 7 days with correct labels and dates", () => {
    const result = getWeeklyFocus([], now);
    const expectedDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    result.forEach((day, i) => {
      expect(day.day).toBe(expectedDays[i]);
      expect(day.date).toBe(format(addDays(weekStart, i), "yyyy-MM-dd"));
    });
  });
});
