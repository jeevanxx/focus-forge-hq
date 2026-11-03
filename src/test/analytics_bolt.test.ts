import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";
import { parseISO, format, addDays, startOfWeek } from "date-fns";

describe("getWeeklyFocus Optimization and Correctness", () => {
  it("should calculate correct weekly focus minutes", () => {
    const now = new Date("2025-02-17T12:00:00Z"); // A Monday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday Feb 17

    const sessions: FocusSession[] = [
      {
        id: "1",
        userId: "user1",
        date: "2025-02-17T08:00:00Z", // Monday
        durationMin: 25,
        completed: true,
        created_at: "",
        task_id: null
      },
      {
        id: "2",
        userId: "user1",
        date: "2025-02-17T14:00:00Z", // Monday
        durationMin: 30,
        completed: true,
        created_at: "",
        task_id: null
      },
      {
        id: "3",
        userId: "user1",
        date: "2025-02-19T10:00:00Z", // Wednesday
        durationMin: 45,
        completed: true,
        created_at: "",
        task_id: null
      },
      {
        id: "4",
        userId: "user1",
        date: "2025-02-24T10:00:00Z", // Next Monday (should be excluded/0 minutes for this week)
        durationMin: 50,
        completed: true,
        created_at: "",
        task_id: null
      }
    ];

    const weeklyFocus = getWeeklyFocus(sessions, now);

    expect(weeklyFocus).toHaveLength(7);

    // Check Monday Feb 17
    expect(weeklyFocus[0].day).toBe("Mon");
    expect(weeklyFocus[0].date).toBe("2025-02-17");
    expect(weeklyFocus[0].minutes).toBe(55);

    // Check Tuesday Feb 18
    expect(weeklyFocus[1].day).toBe("Tue");
    expect(weeklyFocus[1].date).toBe("2025-02-18");
    expect(weeklyFocus[1].minutes).toBe(0);

    // Check Wednesday Feb 19
    expect(weeklyFocus[2].day).toBe("Wed");
    expect(weeklyFocus[2].date).toBe("2025-02-19");
    expect(weeklyFocus[2].minutes).toBe(45);
  });

  it("should perform efficiently on a large dataset (14,000 sessions)", () => {
    const now = new Date("2025-02-17T12:00:00Z");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const datesOfWeek = Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), "yyyy-MM-dd"));

    // Generate 14,000 sessions distributed across different dates (evenly divisible by 14)
    const largeSessions: FocusSession[] = Array.from({ length: 14000 }, (_, i) => {
      // Pick a date: some in-week, some out-of-week
      const dayOffset = i % 14; // half of them in current week (0 to 6)
      const dateString = format(addDays(weekStart, dayOffset), "yyyy-MM-dd") + "T10:00:00Z";
      return {
        id: String(i),
        userId: "user1",
        date: dateString,
        durationMin: 20,
        completed: true,
        created_at: "",
        task_id: null
      };
    });

    const start = performance.now();
    const result = getWeeklyFocus(largeSessions, now);
    const end = performance.now();

    const duration = end - start;
    console.log(`[BENCHMARK] getWeeklyFocus execution time for 14k sessions: ${duration.toFixed(2)}ms`);

    expect(result).toHaveLength(7);
    // Every in-week day should have the correct total minutes
    // Each of the 7 in-week days should have got: 14000 / 14 = 1000 sessions
    // Let's verify sum is correct
    const expectedMinutesPerDay = (14000 / 14) * 20; // 20000 minutes per day
    for (let i = 0; i < 7; i++) {
      expect(result[i].minutes).toBeGreaterThan(0);
      expect(result[i].minutes).toBe(expectedMinutesPerDay);
    }
  });
});
