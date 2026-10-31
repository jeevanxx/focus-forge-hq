import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "@/lib/analytics";
import type { FocusSession } from "@/lib/types";
import { addDays, startOfWeek, format } from "date-fns";

describe("getWeeklyFocus optimization (Bolt)", () => {
  it("calculates weekly focus minutes correctly for empty sessions", () => {
    const now = new Date("2026-10-28T12:00:00.000Z");
    const result = getWeeklyFocus([], now);
    expect(result).toHaveLength(7);
    expect(result.every((d) => d.minutes === 0)).toBe(true);
    expect(result[0].day).toBe("Mon");
    expect(result[6].day).toBe("Sun");
  });

  it("accurately aggregates multiple sessions across days within the current week", () => {
    const now = new Date("2026-10-28T12:00:00.000Z");
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monKey = format(weekStart, "yyyy-MM-dd");
    const tueKey = format(addDays(weekStart, 1), "yyyy-MM-dd");
    const wedKey = format(addDays(weekStart, 2), "yyyy-MM-dd");
    const nextWeekKey = format(addDays(weekStart, 8), "yyyy-MM-dd");

    const sessions: FocusSession[] = [
      {
        id: "s1",
        userId: "u1",
        durationMin: 25,
        startedAt: `${monKey}T09:00:00.000Z`,
        date: `${monKey}T09:00:00.000Z`,
      },
      {
        id: "s2",
        userId: "u1",
        durationMin: 50,
        startedAt: `${monKey}T14:00:00.000Z`,
        date: `${monKey}T14:00:00.000Z`,
      },
      {
        id: "s3",
        userId: "u1",
        durationMin: 30,
        startedAt: `${tueKey}T10:00:00.000Z`,
        date: `${tueKey}T10:00:00.000Z`,
      },
      {
        id: "s4",
        userId: "u1",
        durationMin: 45,
        startedAt: `${wedKey}T11:00:00.000Z`,
        date: `${wedKey}T11:00:00.000Z`,
      },
      {
        id: "s5_out_of_range",
        userId: "u1",
        durationMin: 60,
        startedAt: `${nextWeekKey}T11:00:00.000Z`,
        date: `${nextWeekKey}T11:00:00.000Z`,
      },
    ];

    const result = getWeeklyFocus(sessions, now);
    expect(result.find((d) => d.date === monKey)?.minutes).toBe(75);
    expect(result.find((d) => d.date === tueKey)?.minutes).toBe(30);
    expect(result.find((d) => d.date === wedKey)?.minutes).toBe(45);
    expect(result.find((d) => d.day === "Thu")?.minutes).toBe(0);
  });

  it("benchmarks single-pass execution on a large session dataset", () => {
    // Generate 14,000 focus sessions spanning 14 days
    const totalSessions = 14000;
    const sessions: FocusSession[] = [];
    const baseTime = Date.now();
    for (let i = 0; i < totalSessions; i++) {
      const sessionDate = new Date(baseTime - (i % 14) * 86400000).toISOString();
      sessions.push({
        id: `s_${i}`,
        userId: "user_test",
        durationMin: 25,
        startedAt: sessionDate,
        date: sessionDate,
      });
    }

    const now = new Date(baseTime);

    // Warm-up
    getWeeklyFocus(sessions, now);

    const start = performance.now();
    const result = getWeeklyFocus(sessions, now);
    const duration = performance.now() - start;

    expect(result).toHaveLength(7);
    // With 14,000 items, O(N) single-pass lookup executes in well under 200ms
    expect(duration).toBeLessThan(200);
  }, 20000);
});
