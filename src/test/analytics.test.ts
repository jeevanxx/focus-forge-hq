import { describe, it, expect } from "vitest";
import { getWeeklyFocus, getWeeklyFocusTotal } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { startOfWeek, addDays, format } from "date-fns";

describe("getWeeklyFocus Optimization", () => {
  it("correctly aggregates focus minutes per day for the current week", () => {
    const now = new Date("2025-05-14T12:00:00Z"); // Wednesday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday

    const mondayDate = format(weekStart, "yyyy-MM-dd") + "T09:00:00Z";
    const wednesdayDate = format(addDays(weekStart, 2), "yyyy-MM-dd") + "T14:00:00Z";
    const fridayDate = format(addDays(weekStart, 4), "yyyy-MM-dd") + "T18:00:00Z";

    const sessions: FocusSession[] = [
      { id: "1", date: mondayDate, durationMin: 25 },
      { id: "2", date: mondayDate, durationMin: 50 },
      { id: "3", date: wednesdayDate, durationMin: 45 },
      { id: "4", date: fridayDate, durationMin: 60 },
      // Outside current week
      { id: "5", date: "2025-01-01T10:00:00Z", durationMin: 100 },
    ];

    const result = getWeeklyFocus(sessions, now);

    expect(result).toHaveLength(7);
    expect(result[0].day).toBe("Mon");
    expect(result[0].minutes).toBe(75);
    expect(result[2].day).toBe("Wed");
    expect(result[2].minutes).toBe(45);
    expect(result[4].day).toBe("Fri");
    expect(result[4].minutes).toBe(60);
    expect(result[1].minutes).toBe(0); // Tue

    const total = getWeeklyFocusTotal(sessions, now);
    expect(total).toBe(180);
  });

  it("handles empty sessions gracefully", () => {
    const now = new Date();
    const result = getWeeklyFocus([], now);
    expect(result).toHaveLength(7);
    result.forEach((d) => expect(d.minutes).toBe(0));
  });

  it("benchmark: processes large focus session datasets efficiently", () => {
    const now = new Date("2025-05-14T12:00:00Z");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 14,000 sessions distributed evenly across 14 days
    // 14,000 is a perfect multiple of 14 base
    const sessions: FocusSession[] = [];
    for (let i = 0; i < 14000; i++) {
      const dayOffset = (i % 14) - 3;
      const dateStr = format(addDays(weekStart, dayOffset), "yyyy-MM-dd") + "T10:00:00Z";
      sessions.push({
        id: `sess-${i}`,
        date: dateStr,
        durationMin: 10,
      });
    }

    // Warm up
    getWeeklyFocus(sessions, now);

    const start = performance.now();
    const runs = 10;
    for (let r = 0; r < runs; r++) {
      getWeeklyFocus(sessions, now);
    }
    const duration = performance.now() - start;
    const avgMs = duration / runs;

    // Single-pass O(N) execution should comfortably complete in under 200ms per run
    expect(avgMs).toBeLessThan(200);
  }, 20000);
});
