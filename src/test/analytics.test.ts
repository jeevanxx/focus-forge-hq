import { describe, test, expect } from "vitest";
import { getWeeklyFocus } from "@/lib/analytics";
import type { FocusSession } from "@/lib/types";
import { startOfWeek, addDays, format } from "date-fns";

describe("getWeeklyFocus", () => {
  test("correctly calculates weekly focus minutes per day", () => {
    const now = new Date("2025-03-05T12:00:00Z"); // Wednesday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday 2025-03-03

    const monDate = format(addDays(weekStart, 0), "yyyy-MM-dd");
    const wedDate = format(addDays(weekStart, 2), "yyyy-MM-dd");
    const friDate = format(addDays(weekStart, 4), "yyyy-MM-dd");

    const sessions: FocusSession[] = [
      { id: "1", date: `${monDate}T10:00:00.000Z`, durationMin: 25 },
      { id: "2", date: `${monDate}T14:00:00.000Z`, durationMin: 30 },
      { id: "3", date: `${wedDate}T09:00:00.000Z`, durationMin: 50 },
      { id: "4", date: `${friDate}T16:00:00.000Z`, durationMin: 15 },
      // Session outside current week
      { id: "5", date: "2025-02-20T10:00:00.000Z", durationMin: 60 },
    ];

    const result = getWeeklyFocus(sessions, now);

    expect(result).toHaveLength(7);
    expect(result[0]).toEqual({ day: "Mon", date: monDate, minutes: 55 });
    expect(result[1]).toEqual({ day: "Tue", date: format(addDays(weekStart, 1), "yyyy-MM-dd"), minutes: 0 });
    expect(result[2]).toEqual({ day: "Wed", date: wedDate, minutes: 50 });
    expect(result[3]).toEqual({ day: "Thu", date: format(addDays(weekStart, 3), "yyyy-MM-dd"), minutes: 0 });
    expect(result[4]).toEqual({ day: "Fri", date: friDate, minutes: 15 });
    expect(result[5]).toEqual({ day: "Sat", date: format(addDays(weekStart, 5), "yyyy-MM-dd"), minutes: 0 });
    expect(result[6]).toEqual({ day: "Sun", date: format(addDays(weekStart, 6), "yyyy-MM-dd"), minutes: 0 });
  });

  test(
    "performance benchmark with large dataset",
    () => {
      const now = new Date("2025-03-05T12:00:00Z");
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });

      // Generate 14,000 sessions (multiple of 14 for even distribution)
      const sessions: FocusSession[] = [];
      const count = 14000;
      for (let i = 0; i < count; i++) {
        const dayOffset = i % 14; // 0..13 (spanning 2 weeks)
        const sessionDate = format(addDays(weekStart, dayOffset), "yyyy-MM-dd");
        sessions.push({
          id: `session-${i}`,
          date: `${sessionDate}T10:00:00.000Z`,
          durationMin: 10,
        });
      }

      // Warm up call
      getWeeklyFocus(sessions, now);

      const start = performance.now();
      const runs = 20;
      for (let r = 0; r < runs; r++) {
        getWeeklyFocus(sessions, now);
      }
      const elapsed = performance.now() - start;
      const avgMs = elapsed / runs;

      console.log(`[BENCHMARK] Average getWeeklyFocus runtime for 14,000 sessions: ${avgMs.toFixed(2)} ms per call`);

      const result = getWeeklyFocus(sessions, now);
      // Days 0..6 (Mon..Sun of current week) should each have (14000 / 14) = 1000 sessions * 10 min = 10000 min
      for (let d = 0; d < 7; d++) {
        expect(result[d].minutes).toBe(10000);
      }
    },
    20000
  );
});
