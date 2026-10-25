import { describe, expect, it } from "vitest";
import {
  getWeeklyFocus,
  getCompletionRate,
  getDelayedHighPriority,
  getBestFocusWindow,
  getAverageSessionLength,
  getProductivityScore,
  getNextBestAction,
} from "../lib/analytics";
import type { Task, FocusSession, Habit } from "../lib/types";

describe("Analytics Memoization & Calculations", () => {
  const sampleTasks: Task[] = [
    {
      id: "t1",
      title: "Delayed urgent task",
      done: false,
      priority: "high",
      dueDate: "2020-01-01",
      subtasks: [],
    },
    {
      id: "t2",
      title: "Completed task",
      done: true,
      priority: "med",
      dueDate: "2025-01-01",
      subtasks: [],
    },
  ];

  const sampleSessions: FocusSession[] = [
    {
      id: "s1",
      date: "2025-01-01T10:00:00Z",
      durationMin: 30,
    },
    {
      id: "s2",
      date: "2025-01-01T10:30:00Z",
      durationMin: 25,
    },
  ];

  const sampleHabits: Habit[] = [
    {
      id: "h1",
      title: "Read daily",
      streak: 5,
      history: [true, true, true, false, true],
    },
  ];

  it("calculates all analytics metrics accurately", () => {
    const now = new Date("2025-01-02T12:00:00Z");
    const weekly = getWeeklyFocus(sampleSessions, now);
    const totalMin = weekly.reduce((s, d) => s + d.minutes, 0);
    const completion = getCompletionRate(sampleTasks);
    const delayed = getDelayedHighPriority(sampleTasks, now);
    const window = getBestFocusWindow(sampleSessions);
    const avgSession = getAverageSessionLength(sampleSessions);
    const score = getProductivityScore(sampleTasks, sampleSessions, sampleHabits, now);
    const next = getNextBestAction(sampleTasks, now);

    expect(weekly).toHaveLength(7);
    expect(totalMin).toBeGreaterThanOrEqual(0);
    expect(completion).toBe(50);
    expect(delayed.count).toBe(1);
    expect(delayed.top[0].id).toBe("t1");
    expect(window).not.toBeNull();
    expect(avgSession).toBe(28); // Math.round((30 + 25) / 2)
    expect(score.score).toBeGreaterThan(0);
    expect(next.task?.id).toBe("t1");
  });
});
