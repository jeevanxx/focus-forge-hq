import { test, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import type { FocusSession } from "../lib/types";

test("getWeeklyFocus correctness and performance benchmark", () => {
  const baseDate = new Date(2025, 1, 10); // Feb 10, 2025 (Monday)

  // Test 1: Basic correctness
  const sampleSessions: FocusSession[] = [
    {
      id: "s1",
      user_id: "u1",
      date: new Date(2025, 1, 10, 10, 0, 0).toISOString(),
      durationMin: 30,
      mode: "pomodoro",
    },
    {
      id: "s2",
      user_id: "u1",
      date: new Date(2025, 1, 10, 14, 0, 0).toISOString(),
      durationMin: 45,
      mode: "pomodoro",
    },
    {
      id: "s3",
      user_id: "u1",
      date: new Date(2025, 1, 12, 9, 0, 0).toISOString(), // Wednesday
      durationMin: 60,
      mode: "stopwatch",
    },
    {
      id: "s4",
      user_id: "u1",
      date: new Date(2025, 1, 20, 9, 0, 0).toISOString(), // Outside week
      durationMin: 120,
      mode: "pomodoro",
    },
  ];

  const weeklyFocus = getWeeklyFocus(sampleSessions, baseDate);
  expect(weeklyFocus).toHaveLength(7);
  expect(weeklyFocus[0]).toEqual({ day: "Mon", date: "2025-02-10", minutes: 75 });
  expect(weeklyFocus[1]).toEqual({ day: "Tue", date: "2025-02-11", minutes: 0 });
  expect(weeklyFocus[2]).toEqual({ day: "Wed", date: "2025-02-12", minutes: 60 });

  // Test 2: Large dataset benchmarking
  const largeSessions: FocusSession[] = [];
  for (let i = 0; i < 14000; i++) {
    const dayOffset = i % 14;
    const d = new Date(baseDate.getTime() + dayOffset * 86400000);
    largeSessions.push({
      id: `session-${i}`,
      user_id: "user-1",
      date: d.toISOString(),
      durationMin: 25,
      mode: "pomodoro",
    });
  }

  // Warm up call
  getWeeklyFocus(largeSessions, baseDate);

  const start = performance.now();
  const runs = 10;
  for (let r = 0; r < runs; r++) {
    getWeeklyFocus(largeSessions, baseDate);
  }
  const avgMs = (performance.now() - start) / runs;

  // Single-pass execution for 14,000 sessions should execute fast (< 200ms per call)
  expect(avgMs).toBeLessThan(200);
}, 20000);
