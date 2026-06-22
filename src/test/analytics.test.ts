
import { describe, it, expect } from "vitest";
import { getWeeklyFocus, getWeeklyFocusTotal } from "../lib/analytics";
import { FocusSession } from "../lib/mock-data";

describe("analytics performance and correctness", () => {
  const mockNow = new Date("2024-05-20T12:00:00Z"); // Monday

  it("getWeeklyFocus groups sessions correctly and handles range boundaries", () => {
    const sessions: FocusSession[] = [
      { id: "s1", date: "2024-05-20T00:00:00Z", durationMin: 10 }, // Mon start
      { id: "s2", date: "2024-05-20T23:59:59Z", durationMin: 20 }, // Mon end
      { id: "s3", date: "2024-05-26T23:59:59Z", durationMin: 30 }, // Sun end
      { id: "s4", date: "2024-05-19T23:59:59Z", durationMin: 40 }, // Last Sun (out)
      { id: "s5", date: "2024-05-27T00:00:00Z", durationMin: 50 }, // Next Mon (out)
    ];

    const weekly = getWeeklyFocus(sessions, mockNow);

    expect(weekly[0].minutes).toBe(30); // Mon (10 + 20)
    expect(weekly[6].minutes).toBe(30); // Sun
    expect(weekly.reduce((acc, d) => acc + d.minutes, 0)).toBe(60);
  });

  it("getWeeklyFocusTotal matches getWeeklyFocus sum", () => {
    const sessions: FocusSession[] = [
      { id: "s1", date: "2024-05-20T10:00:00Z", durationMin: 30 },
      { id: "s2", date: "2024-05-21T10:00:00Z", durationMin: 60 },
      { id: "s3", date: "2024-05-27T10:00:00Z", durationMin: 90 },
    ];

    const total = getWeeklyFocusTotal(sessions, mockNow);
    const weeklySum = getWeeklyFocus(sessions, mockNow).reduce((s, d) => s + d.minutes, 0);

    expect(total).toBe(90);
    expect(total).toBe(weeklySum);
  });
});
