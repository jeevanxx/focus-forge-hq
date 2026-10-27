import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "@/lib/analytics";
import type { FocusSession } from "@/lib/types";

describe("getWeeklyFocus analytics", () => {
  it("correctly aggregates weekly focus minutes per day", () => {
    // Fixed reference date: Wednesday, May 15, 2024
    const now = new Date("2024-05-15T12:00:00.000Z");

    const mockSessions: FocusSession[] = [
      {
        id: "1",
        userId: "u1",
        durationMin: 30,
        taskTitle: "Task 1",
        taskId: "t1",
        startedAt: "2024-05-13T09:00:00.000Z", // Monday
        date: "2024-05-13T09:00:00.000Z",
      },
      {
        id: "2",
        userId: "u1",
        durationMin: 45,
        taskTitle: "Task 2",
        taskId: "t2",
        startedAt: "2024-05-13T14:00:00.000Z", // Monday
        date: "2024-05-13T14:00:00.000Z",
      },
      {
        id: "3",
        userId: "u1",
        durationMin: 60,
        taskTitle: "Task 3",
        taskId: "t3",
        startedAt: "2024-05-15T10:00:00.000Z", // Wednesday
        date: "2024-05-15T10:00:00.000Z",
      },
      {
        id: "4",
        userId: "u1",
        durationMin: 25,
        taskTitle: "Task 4",
        taskId: "t4",
        startedAt: "2024-05-20T09:00:00.000Z", // Next week Monday (out of range)
        date: "2024-05-20T09:00:00.000Z",
      },
    ];

    const result = getWeeklyFocus(mockSessions, now);

    expect(result).toHaveLength(7);
    expect(result[0].day).toBe("Mon");
    expect(result[0].minutes).toBe(75); // 30 + 45
    expect(result[2].day).toBe("Wed");
    expect(result[2].minutes).toBe(60);
    expect(result[1].minutes).toBe(0); // Tuesday
  });

  it("handles empty focus session array gracefully", () => {
    const now = new Date("2024-05-15T12:00:00.000Z");
    const result = getWeeklyFocus([], now);

    expect(result).toHaveLength(7);
    result.forEach((d) => {
      expect(d.minutes).toBe(0);
    });
  });

  it("handles benchmark performance with large session dataset", () => {
    const now = new Date("2024-05-15T12:00:00.000Z");
    const sessionsCount = 14000;
    const mockSessions: FocusSession[] = Array.from({ length: sessionsCount }, (_, i) => ({
      id: `s-${i}`,
      userId: "u1",
      durationMin: 25,
      date: new Date(1715558400000 + (i % 14) * 86400000).toISOString(),
    }));

    const start = performance.now();
    const result = getWeeklyFocus(mockSessions, now);
    const duration = performance.now() - start;

    expect(result).toHaveLength(7);
    // 14,000 sessions evenly spread over 14 days = 1,000 per day.
    // Each matching day in the current week (7 days) should have 1,000 * 25 = 25,000 mins.
    expect(result[0].minutes).toBe(25000);
    expect(duration).toBeLessThan(200); // Expect single-pass Map iteration to complete rapidly (< 200ms)
  }, 20000);
});
