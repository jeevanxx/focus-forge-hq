import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";

describe("getWeeklyFocus optimization benchmarks and correctness", () => {
  it("should match original behavior and correctly aggregate daily focus minutes", () => {
    const now = new Date("2026-08-05T12:00:00.000Z"); // a Wednesday
    const sessions: FocusSession[] = [
      { id: "1", date: "2026-08-03T10:00:00.000Z", durationMin: 30 }, // Monday
      { id: "2", date: "2026-08-03T14:00:00.000Z", durationMin: 45 }, // Monday
      { id: "3", date: "2026-08-04T09:30:00.000Z", durationMin: 25 }, // Tuesday
      { id: "4", date: "2026-08-05T11:15:00.000Z", durationMin: 50 }, // Wednesday
      { id: "5", date: "2026-08-07T16:00:00.000Z", durationMin: 60 }, // Friday
    ];

    const weekly = getWeeklyFocus(sessions, now);

    expect(weekly).toHaveLength(7);
    expect(weekly[0]).toEqual({ day: "Mon", date: "2026-08-03", minutes: 75 });
    expect(weekly[1]).toEqual({ day: "Tue", date: "2026-08-04", minutes: 25 });
    expect(weekly[2]).toEqual({ day: "Wed", date: "2026-08-05", minutes: 50 });
    expect(weekly[3]).toEqual({ day: "Thu", date: "2026-08-06", minutes: 0 });
    expect(weekly[4]).toEqual({ day: "Fri", date: "2026-08-07", minutes: 60 });
    expect(weekly[5]).toEqual({ day: "Sat", date: "2026-08-08", minutes: 0 });
    expect(weekly[6]).toEqual({ day: "Sun", date: "2026-08-09", minutes: 0 });
  });

  it("should perform at O(N) complexity for a large dataset", { timeout: 20000 }, () => {
    const now = new Date("2026-08-05T12:00:00.000Z");
    const numSessions = 10000;
    const baseDate = new Date("2026-08-03T00:00:00.000Z"); // Monday
    const sessions: FocusSession[] = [];

    // Generate 10k sessions spread across the week
    for (let i = 0; i < numSessions; i++) {
      const dayOffset = i % 7;
      const hourOffset = (i * 3) % 24;
      const minOffset = (i * 7) % 60;
      const date = new Date(baseDate);
      date.setDate(date.getDate() + dayOffset);
      date.setHours(hourOffset);
      date.setMinutes(minOffset);

      sessions.push({
        id: String(i),
        date: date.toISOString(),
        durationMin: 15,
      });
    }

    // Warm up the engine first so Vitest compile overhead isn't counted in the profiled loop
    getWeeklyFocus(sessions.slice(0, 100), now);

    const start = performance.now();
    const result = getWeeklyFocus(sessions, now);
    const end = performance.now();

    const duration = end - start;
    console.log(`[PROFILE] getWeeklyFocus processing time for ${numSessions} sessions: ${duration.toFixed(2)}ms`);

    expect(result).toHaveLength(7);
    // 10000 / 7 is ~1428.57 sessions per day
    for (const r of result) {
      expect(r.minutes).toBeGreaterThan(0);
    }

    // O(N) optimized implementation runs this dataset extremely fast,
    // whereas O(7N) with full array filtering takes much longer. We allow a generous limit to avoid environment flakiness.
    expect(duration).toBeLessThan(200);
  });
});
