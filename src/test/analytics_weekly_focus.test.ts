import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "@/lib/analytics";
import type { FocusSession } from "@/lib/types";
import { startOfWeek, addDays, format } from "date-fns";

describe("getWeeklyFocus", () => {
  it("returns 7 days initialized with 0 minutes when sessions are empty", () => {
    const now = new Date("2025-05-14T12:00:00.000Z");
    const result = getWeeklyFocus([], now);
    expect(result).toHaveLength(7);
    result.forEach((d) => {
      expect(d.minutes).toBe(0);
    });
  });

  it("aggregates session minutes accurately by day of week", () => {
    const now = new Date("2025-05-14T12:00:00.000Z"); // Wednesday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday

    const monDate = format(addDays(weekStart, 0), "yyyy-MM-dd");
    const wedDate = format(addDays(weekStart, 2), "yyyy-MM-dd");

    const sessions: FocusSession[] = [
      { id: "1", date: `${monDate}T09:00:00`, durationMin: 25, completed: true },
      { id: "2", date: `${monDate}T14:00:00`, durationMin: 50, completed: true },
      { id: "3", date: `${wedDate}T10:00:00`, durationMin: 40, completed: true },
    ];

    const result = getWeeklyFocus(sessions, now);
    expect(result[0].day).toBe("Mon");
    expect(result[0].minutes).toBe(75);
    expect(result[2].day).toBe("Wed");
    expect(result[2].minutes).toBe(40);
    expect(result[1].minutes).toBe(0);
  });

  it("benchmarks performance on large datasets (14,000 sessions)", { timeout: 20000 }, () => {
    const now = new Date("2025-05-14T12:00:00.000Z");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    const sessions: FocusSession[] = Array.from({ length: 14000 }, (_, i) => {
      const dayOffset = i % 14;
      const sessionDate = format(addDays(weekStart, dayOffset), "yyyy-MM-dd");
      return {
        id: `sess-${i}`,
        date: `${sessionDate}T10:00:00.000Z`,
        durationMin: 15,
        completed: true,
      };
    });

    // Warm-up
    getWeeklyFocus(sessions, now);

    const start = performance.now();
    for (let r = 0; r < 5; r++) {
      getWeeklyFocus(sessions, now);
    }
    const end = performance.now();
    const avgDuration = (end - start) / 5;

    console.log(`Average getWeeklyFocus execution time (14k sessions): ${avgDuration.toFixed(2)}ms`);
    expect(avgDuration).toBeLessThan(1500); // Baseline threshold before optimization
  });
});
