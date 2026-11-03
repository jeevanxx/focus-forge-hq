import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { startOfWeek, addDays, format } from "date-fns";

describe("getWeeklyFocus performance & correctness", () => {
  const referenceDate = new Date("2025-03-05T12:00:00Z"); // Wednesday
  const monday = startOfWeek(referenceDate, { weekStartsOn: 1 });

  it("calculates weekly focus accurately for sessions", () => {
    const sessions: FocusSession[] = [
      {
        id: "1",
        date: format(monday, "yyyy-MM-dd'T'10:00:00"),
        durationMin: 45,
        mode: "pomodoro",
        completed: true,
      },
      {
        id: "2",
        date: format(monday, "yyyy-MM-dd'T'14:00:00"),
        durationMin: 30,
        mode: "pomodoro",
        completed: true,
      },
      {
        id: "3",
        date: format(addDays(monday, 2), "yyyy-MM-dd'T'09:30:00"),
        durationMin: 60,
        mode: "flow",
        completed: true,
      },
      {
        id: "4",
        // Date outside current week
        date: format(addDays(monday, 10), "yyyy-MM-dd'T'11:00:00"),
        durationMin: 120,
        mode: "pomodoro",
        completed: true,
      },
    ];

    const weekly = getWeeklyFocus(sessions, referenceDate);

    expect(weekly).toHaveLength(7);
    expect(weekly[0].day).toBe("Mon");
    expect(weekly[0].minutes).toBe(75); // 45 + 30
    expect(weekly[1].day).toBe("Tue");
    expect(weekly[1].minutes).toBe(0);
    expect(weekly[2].day).toBe("Wed");
    expect(weekly[2].minutes).toBe(60);
  });

  it("handles empty sessions gracefully", () => {
    const weekly = getWeeklyFocus([], referenceDate);
    expect(weekly).toHaveLength(7);
    weekly.forEach((day) => expect(day.minutes).toBe(0));
  });

  it("executes single-pass aggregation efficiently on large dataset", () => {
    // Generate 14,000 focus sessions evenly distributed over 14 days
    // to ensure an exact multiple of the 14-day loop base.
    const sampleSessions: FocusSession[] = [];
    for (let i = 0; i < 14000; i++) {
      const dayOffset = i % 14;
      const sessionDate = addDays(monday, dayOffset);
      sampleSessions.push({
        id: `sess-${i}`,
        date: format(sessionDate, "yyyy-MM-dd'T'10:00:00"),
        durationMin: 25,
        mode: "pomodoro",
        completed: true,
      });
    }

    const start = performance.now();
    const result = getWeeklyFocus(sampleSessions, referenceDate);
    const end = performance.now();

    const duration = end - start;
    expect(result).toHaveLength(7);
    // 7 days in week, each week day gets 1000 sessions * 25 mins = 25000 mins
    expect(result[0].minutes).toBe(25000);
    // Ensure execution remains well within 200ms threshold for 14,000 sessions
    expect(duration).toBeLessThan(200);
  });
});
