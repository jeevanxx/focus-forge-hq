import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { format, addDays, startOfWeek } from "date-fns";

describe("getWeeklyFocus performance & correctness", () => {
  it("correctly aggregates focus minutes per day", () => {
    const now = new Date(2025, 0, 15); // Wednesday Jan 15 2025
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Mon Jan 13 2025

    const monDate = format(weekStart, "yyyy-MM-dd");
    const wedDate = format(addDays(weekStart, 2), "yyyy-MM-dd");
    const friDate = format(addDays(weekStart, 4), "yyyy-MM-dd");

    const mockSessions: FocusSession[] = [
      { id: "1", date: `${monDate}T09:00:00Z`, durationMin: 25 },
      { id: "2", date: `${monDate}T14:00:00Z`, durationMin: 50 },
      { id: "3", date: `${wedDate}T10:00:00Z`, durationMin: 30 },
      { id: "4", date: `${friDate}T16:00:00Z`, durationMin: 45 },
      // Out of week session
      { id: "5", date: "2024-12-01T10:00:00Z", durationMin: 60 },
    ];

    const result = getWeeklyFocus(mockSessions, now);

    expect(result).toHaveLength(7);
    expect(result.find((d) => d.date === monDate)?.minutes).toBe(75);
    expect(result.find((d) => d.date === wedDate)?.minutes).toBe(30);
    expect(result.find((d) => d.date === friDate)?.minutes).toBe(45);
    expect(result.find((d) => d.day === "Tue")?.minutes).toBe(0);
  });

  it("handles large datasets efficiently (O(N) single pass)", () => {
    const now = new Date(2025, 0, 15);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 14,000 focus sessions evenly distributed across 14 days
    const mockSessions: FocusSession[] = [];
    for (let i = 0; i < 14000; i++) {
      const dayOffset = i % 14; // 0..13 (7 days in target week + 7 days outside)
      const sessionDate = format(addDays(weekStart, dayOffset), "yyyy-MM-dd");
      mockSessions.push({
        id: `sess_${i}`,
        date: `${sessionDate}T10:00:00.000Z`,
        durationMin: 10,
      });
    }

    // Warm-up call
    getWeeklyFocus(mockSessions, now);

    const start = performance.now();
    const result = getWeeklyFocus(mockSessions, now);
    const duration = performance.now() - start;

    expect(result).toHaveLength(7);
    // 14,000 / 14 = 1,000 sessions per day * 10 min = 10,000 min per day in target week
    for (const d of result) {
      expect(d.minutes).toBe(10000);
    }

    // Should complete in well under 200ms
    expect(duration).toBeLessThan(200);
  }, 20000);
});
