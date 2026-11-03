import { describe, test, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";

describe("getWeeklyFocus benchmark & correctness", () => {
  test("correctly calculates weekly focus minutes", () => {
    const now = new Date("2025-01-15T12:00:00.000Z"); // Wed
    const mockSessions: FocusSession[] = [
      { id: "1", user_id: "u1", task_id: "t1", durationMin: 30, date: "2025-01-13T10:00:00.000Z", created_at: "" }, // Mon
      { id: "2", user_id: "u1", task_id: "t2", durationMin: 45, date: "2025-01-13T14:00:00.000Z", created_at: "" }, // Mon
      { id: "3", user_id: "u1", task_id: "t3", durationMin: 60, date: "2025-01-15T09:00:00.000Z", created_at: "" }, // Wed
      { id: "4", user_id: "u1", task_id: "t4", durationMin: 90, date: "2025-01-19T20:00:00.000Z", created_at: "" }, // Sun
      { id: "5", user_id: "u1", task_id: "t5", durationMin: 120, date: "2025-01-20T10:00:00.000Z", created_at: "" }, // Next Mon
    ];

    const result = getWeeklyFocus(mockSessions, now);
    expect(result).toHaveLength(7);
    expect(result[0]).toEqual({ day: "Mon", date: "2025-01-13", minutes: 75 });
    expect(result[1]).toEqual({ day: "Tue", date: "2025-01-14", minutes: 0 });
    expect(result[2]).toEqual({ day: "Wed", date: "2025-01-15", minutes: 60 });
    expect(result[6]).toEqual({ day: "Sun", date: "2025-01-19", minutes: 90 });
  });

  test("performance with 14,000 sessions executing in single-pass O(N)", () => {
    const now = new Date("2025-01-15T12:00:00.000Z");
    const sessionsCount = 14000;
    const mockSessions: FocusSession[] = Array.from({ length: sessionsCount }, (_, i) => {
      const dayOffset = i % 14;
      const day = 13 + dayOffset;
      const dateStr = `2025-01-${day < 10 ? "0" + day : day}T10:00:00.000Z`;
      return {
        id: `s-${i}`,
        user_id: "u1",
        task_id: "t1",
        durationMin: 15,
        date: dateStr,
        created_at: dateStr,
      };
    });

    const start = performance.now();
    const result = getWeeklyFocus(mockSessions, now);
    const duration = performance.now() - start;

    expect(result).toHaveLength(7);
    // Single-pass O(N) execution should easily complete in well under 300ms for 14,000 items
    expect(duration).toBeLessThan(300);
  }, 20000);
});
