import { describe, test, expect } from "vitest";
import { getWeeklyFocus } from "@/lib/analytics";
import type { FocusSession } from "@/lib/types";
import { format, addDays, startOfWeek } from "date-fns";

describe("getWeeklyFocus benchmark & verification", () => {
  test("correctly calculates weekly focus minutes", () => {
    const now = new Date("2025-02-19T12:00:00Z"); // Wednesday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday 2025-02-17

    const sessions: FocusSession[] = [
      {
        id: "1",
        taskId: "t1",
        date: new Date("2025-02-17T09:00:00Z").toISOString(), // Mon
        durationMin: 45,
      },
      {
        id: "2",
        taskId: "t2",
        date: new Date("2025-02-17T14:00:00Z").toISOString(), // Mon
        durationMin: 30,
      },
      {
        id: "3",
        taskId: "t3",
        date: new Date("2025-02-19T10:00:00Z").toISOString(), // Wed
        durationMin: 60,
      },
      {
        id: "4",
        taskId: "t4",
        date: new Date("2025-02-23T18:00:00Z").toISOString(), // Sun
        durationMin: 25,
      },
      {
        id: "5",
        taskId: "t5",
        date: new Date("2025-02-10T10:00:00Z").toISOString(), // Previous week
        durationMin: 100,
      },
    ];

    const result = getWeeklyFocus(sessions, now);
    expect(result).toHaveLength(7);
    expect(result[0]).toEqual({
      day: "Mon",
      date: format(weekStart, "yyyy-MM-dd"),
      minutes: 75,
    });
    expect(result[2]).toEqual({
      day: "Wed",
      date: format(addDays(weekStart, 2), "yyyy-MM-dd"),
      minutes: 60,
    });
    expect(result[6]).toEqual({
      day: "Sun",
      date: format(addDays(weekStart, 6), "yyyy-MM-dd"),
      minutes: 25,
    });
    expect(result[1].minutes).toBe(0); // Tue
  });

  test("performance benchmark on large session array", () => {
    const now = new Date("2025-02-19T12:00:00Z");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Generate 14,000 sessions (a multiple of 14) spread over past 14 days
    const mockSessions: FocusSession[] = [];
    for (let i = 0; i < 14000; i++) {
      const dayOffset = i % 14;
      const sessionDate = addDays(weekStart, dayOffset - 3);
      mockSessions.push({
        id: `s-${i}`,
        taskId: `t-${i}`,
        date: sessionDate.toISOString(),
        durationMin: 25,
      });
    }

    const start = performance.now();
    for (let run = 0; run < 10; run++) {
      getWeeklyFocus(mockSessions, now);
    }
    const duration = performance.now() - start;
    console.log(`Execution time for 10 runs of 14,000 sessions: ${duration.toFixed(2)}ms`);
  }, 20000);
});
