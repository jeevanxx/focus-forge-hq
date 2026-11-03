import { describe, test, expect } from "vitest";
import { getWeeklyFocus } from "@/lib/analytics";
import type { FocusSession } from "@/lib/types";
import { startOfWeek, addDays, format } from "date-fns";

describe("Analytics Bolt Optimization", () => {
  const fixedNow = new Date("2025-01-15T12:00:00Z"); // Wednesday
  const weekStart = startOfWeek(fixedNow, { weekStartsOn: 1 });

  test("correctly calculates daily focus minutes for week sessions", () => {
    const mondayISO = format(addDays(weekStart, 0), "yyyy-MM-dd") + "T09:00:00Z";
    const wednesdayISO = format(addDays(weekStart, 2), "yyyy-MM-dd") + "T14:00:00Z";

    const mockSessions: FocusSession[] = [
      { id: "1", date: mondayISO, durationMin: 45 },
      { id: "2", date: mondayISO, durationMin: 30 },
      { id: "3", date: wednesdayISO, durationMin: 60 },
      { id: "4", date: "2024-01-01T10:00:00Z", durationMin: 120 }, // Out of week
    ];

    const result = getWeeklyFocus(mockSessions, fixedNow);

    expect(result).toHaveLength(7);
    expect(result[0].day).toBe("Mon");
    expect(result[0].minutes).toBe(75); // 45 + 30
    expect(result[2].day).toBe("Wed");
    expect(result[2].minutes).toBe(60);
    expect(result[1].minutes).toBe(0); // Tue
  });

  test("single-pass O(N) getWeeklyFocus benchmark handles 14,000 sessions efficiently", () => {
    // Generate 14,000 sessions distributed across 14 days (7 within current week, 7 outside)
    const totalSessions = 14000;
    const mockSessions: FocusSession[] = [];

    for (let i = 0; i < totalSessions; i++) {
      const dayOffset = (i % 14) - 3; // spread across 14 days
      const sessionDate = format(addDays(weekStart, dayOffset), "yyyy-MM-dd") + "T10:00:00Z";
      mockSessions.push({
        id: `sess-${i}`,
        date: sessionDate,
        durationMin: 20,
      });
    }

    // Warm-up call
    getWeeklyFocus(mockSessions, fixedNow);

    const start = performance.now();
    const runs = 20;
    for (let r = 0; r < runs; r++) {
      getWeeklyFocus(mockSessions, fixedNow);
    }
    const totalTimeMs = performance.now() - start;
    const avgTimeMs = totalTimeMs / runs;

    expect(avgTimeMs).toBeLessThan(200); // Expect fast execution well under 200ms per call
  }, 20000);
});
