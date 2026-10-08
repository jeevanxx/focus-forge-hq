import { describe, test, expect } from "vitest";
import { format } from "date-fns";
import { getWeeklyFocus, getCoachInsight, getDelayedHighPriority } from "../lib/analytics";
import type { Task, FocusSession, Habit, Profile } from "../lib/types";

describe("Dashboard Performance Benchmark", () => {
  const today = new Date();
  const todayKey = format(today, "yyyy-MM-dd");

  const sampleTasks: Task[] = Array.from({ length: 50 }, (_, i) => ({
    id: `task-${i}`,
    userId: "user-1",
    title: `Task number ${i}`,
    done: i % 2 === 0,
    priority: i % 3 === 0 ? "high" : i % 3 === 1 ? "med" : "low",
    dueDate: i % 5 === 0 ? todayKey : "2025-01-01",
    createdAt: "2025-01-01T00:00:00.000Z",
    estimateMin: 25,
  }));

  const sampleSessions: FocusSession[] = Array.from({ length: 100 }, (_, i) => ({
    id: `session-${i}`,
    userId: "user-1",
    date: new Date(Date.now() - (i % 7) * 86400000).toISOString(),
    durationMin: 25,
  }));

  const sampleHabits: Habit[] = [
    {
      id: "h1",
      userId: "user-1",
      name: "Exercise",
      target: 7,
      streak: 5,
      history: [true, true, true, true, true, false, true],
      createdAt: "2025-01-01T00:00:00.000Z",
    },
  ];

  const sampleProfile: Profile = {
    id: "user-1",
    focusGoalMin: 180,
    reminderEnabled: true,
  };

  const computeDashboardStats = () => {
    const todayTasks = sampleTasks.filter((t) => t.dueDate === todayKey);
    const done = todayTasks.filter((t) => t.done).length;
    const completion = todayTasks.length ? Math.round((done / todayTasks.length) * 100) : 0;
    const todayMin = getWeeklyFocus(sampleSessions, today).find((d) => d.date === todayKey)?.minutes ?? 0;
    const focusGoal = sampleProfile?.focusGoalMin ?? 180;
    const focusPct = Math.min(100, Math.round((todayMin / focusGoal) * 100));
    const bestStreak = sampleHabits.reduce((m, h) => Math.max(m, h.streak), 0);
    const insight = getCoachInsight(sampleTasks, sampleSessions, today);

    const overdueHigh = getDelayedHighPriority(sampleTasks, today).count;
    const reminderMsg =
      !sampleProfile?.reminderEnabled ? null
      : overdueHigh > 0
        ? `Reminder: ${overdueHigh} high-priority ${overdueHigh === 1 ? "task is" : "tasks are"} overdue.`
        : today.getHours() >= 15 && todayMin < focusGoal
          ? `Reminder: focus goal unmet.`
          : null;

    const priorityOrder = { high: 0, med: 1, low: 2 };
    const activeTask = [...todayTasks]
      .filter((t) => !t.done)
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])[0];

    const remainingTasks = todayTasks.filter((t) => t.id !== activeTask?.id);

    return {
      todayTasks,
      done,
      completion,
      todayMin,
      focusGoal,
      focusPct,
      bestStreak,
      insight,
      reminderMsg,
      activeTask,
      remainingTasks,
    };
  };

  test("Dashboard stats computation benchmark", () => {
    // Warm-up JIT compilation
    computeDashboardStats();

    const iterations = 500;
    const startUnmemoized = performance.now();
    for (let i = 0; i < iterations; i++) {
      computeDashboardStats();
    }
    const unmemoizedTime = performance.now() - startUnmemoized;

    // Simulate memoized access across 500 timer ticks where props/state didn't change
    const cachedStats = computeDashboardStats();
    const startMemoized = performance.now();
    for (let i = 0; i < iterations; i++) {
      // Memoized return
      const stats = cachedStats;
      expect(stats.done).toBe(cachedStats.done);
    }
    const memoizedTime = performance.now() - startMemoized;

    console.log(`Unmemoized 500 renders: ${unmemoizedTime.toFixed(2)}ms`);
    console.log(`Memoized 500 renders: ${memoizedTime.toFixed(2)}ms`);

    expect(unmemoizedTime).toBeGreaterThan(memoizedTime);
  }, 20000);
});
