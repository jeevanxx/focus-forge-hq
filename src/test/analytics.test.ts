import { describe, it, expect } from "vitest";
import { getWeeklyFocus, getWeeklyFocusTotal } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { format, startOfWeek, addDays } from "date-fns";

describe("analytics - getWeeklyFocus", () => {
  it("correctly aggregates focus minutes for current week days", () => {
    const now = new Date(2025, 0, 15); // Wednesday, Jan 15, 2025
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Mon Jan 13, 2025

    const monDate = format(addDays(weekStart, 0), "yyyy-MM-dd");
    const wedDate = format(addDays(weekStart, 2), "yyyy-MM-dd");
    const sunDate = format(addDays(weekStart, 6), "yyyy-MM-dd");

    const sessions: FocusSession[] = [
      { id: "1", date: `${monDate}T09:00:00.000Z`, durationMin: 25 },
      { id: "2", date: `${monDate}T14:00:00.000Z`, durationMin: 50 },
      { id: "3", date: `${wedDate}T10:00:00.000Z`, durationMin: 30 },
      { id: "4", date: `${sunDate}T18:00:00.000Z`, durationMin: 45 },
      // Session outside current week (2 weeks ago)
      { id: "5", date: "2024-12-01T10:00:00.000Z", durationMin: 60 },
    ];

    const weekly = getWeeklyFocus(sessions, now);

    expect(weekly.length).toBe(7);
    expect(weekly.find((d) => d.day === "Mon")?.minutes).toBe(75);
    expect(weekly.find((d) => d.day === "Tue")?.minutes).toBe(0);
    expect(weekly.find((d) => d.day === "Wed")?.minutes).toBe(30);
    expect(weekly.find((d) => d.day === "Thu")?.minutes).toBe(0);
    expect(weekly.find((d) => d.day === "Fri")?.minutes).toBe(0);
    expect(weekly.find((d) => d.day === "Sat")?.minutes).toBe(0);
    expect(weekly.find((d) => d.day === "Sun")?.minutes).toBe(45);

    const total = getWeeklyFocusTotal(sessions, now);
    expect(total).toBe(150);
  });

  it("handles empty sessions array cleanly", () => {
    const now = new Date();
    const weekly = getWeeklyFocus([], now);
    expect(weekly.length).toBe(7);
    weekly.forEach((d) => expect(d.minutes).toBe(0));
    expect(getWeeklyFocusTotal([], now)).toBe(0);
  });

  it(
    "performance benchmark: efficiently aggregates 14,000 sessions in single pass",
    { timeout: 20000 },
    () => {
      const now = new Date(2025, 0, 15);
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });

      // Generate 14,000 sessions evenly distributed across 14 days (7 in-week, 7 out-of-week)
      const datasetSize = 14000;
      const sessions: FocusSession[] = [];
      for (let i = 0; i < datasetSize; i++) {
        const dayOffset = i % 14; // 0..6 in week, 7..13 out of week
        const sessionDate = format(addDays(weekStart, dayOffset), "yyyy-MM-dd");
        sessions.push({
          id: `sess-${i}`,
          date: `${sessionDate}T10:00:00.000Z`,
          durationMin: 20,
        });
      }

      // Warm-up call to avoid measuring initial JIT / compilation overhead
      getWeeklyFocus(sessions, now);

      const runs = 5;
      const t0 = performance.now();
      for (let r = 0; r < runs; r++) {
        getWeeklyFocus(sessions, now);
      }
      const t1 = performance.now();
      const avgMs = (t1 - t0) / runs;

      // Single-pass O(N) execution for 14,000 sessions takes ~20ms-180ms depending on CPU
      expect(avgMs).toBeLessThan(350);

      // Verify calculation correctness over the benchmark dataset
      const weekly = getWeeklyFocus(sessions, now);
      const totalMinutes = weekly.reduce((sum, d) => sum + d.minutes, 0);
      // 7,000 sessions in-week * 20 min = 140,000 min
      expect(totalMinutes).toBe(140000);
    }
  );
});
