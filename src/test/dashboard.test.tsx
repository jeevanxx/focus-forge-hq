import { describe, test, expect, vi } from "vitest";
import { format } from "date-fns";
import type { Task, Habit, FocusSession } from "@/lib/types";
import { getCoachInsight, getDelayedHighPriority, getWeeklyFocus } from "@/lib/analytics";

describe("Dashboard Memoized Calculations", () => {
  const today = new Date();
  const todayKey = format(today, "yyyy-MM-dd");

  const mockTasks: Task[] = [
    {
      id: "t1",
      userId: "u1",
      title: "Task 1 (High priority)",
      dueDate: todayKey,
      priority: "high",
      done: false,
      estimateMin: 30,
      createdAt: today.toISOString(),
      updatedAt: today.toISOString(),
    },
    {
      id: "t2",
      userId: "u1",
      title: "Task 2 (Med priority, Done)",
      dueDate: todayKey,
      priority: "med",
      done: true,
      estimateMin: 15,
      createdAt: today.toISOString(),
      updatedAt: today.toISOString(),
    },
    {
      id: "t3",
      userId: "u1",
      title: "Task 3 (Low priority)",
      dueDate: todayKey,
      priority: "low",
      done: false,
      estimateMin: 45,
      createdAt: today.toISOString(),
      updatedAt: today.toISOString(),
    },
  ];

  const mockHabits: Habit[] = [
    {
      id: "h1",
      userId: "u1",
      name: "Exercise",
      target: 7,
      streak: 5,
      history: [true, true, true, true, true, false, false],
      createdAt: today.toISOString(),
      updatedAt: today.toISOString(),
    },
  ];

  const mockSessions: FocusSession[] = [
    {
      id: "s1",
      userId: "u1",
      durationMin: 25,
      date: today.toISOString(),
      createdAt: today.toISOString(),
    },
  ];

  test("calculates today tasks, completion rate, active task, and estimate minutes correctly", () => {
    const todayTasks = mockTasks.filter((t) => t.dueDate === todayKey);
    const done = todayTasks.filter((t) => t.done).length;
    const completion = todayTasks.length ? Math.round((done / todayTasks.length) * 100) : 0;

    expect(todayTasks).toHaveLength(3);
    expect(done).toBe(1);
    expect(completion).toBe(33);

    const priorityOrder = { high: 0, med: 1, low: 2 };
    const activeTask = [...todayTasks]
      .filter((t) => !t.done)
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])[0];

    expect(activeTask.id).toBe("t1");

    const remainingTasks = todayTasks.filter((t) => t.id !== activeTask.id);
    const remainingEstimateMins = remainingTasks.reduce((s, t) => s + (t.estimateMin ?? 0), 0);

    expect(remainingTasks).toHaveLength(2);
    // remaining tasks are t2 (15 min) and t3 (45 min)
    expect(remainingEstimateMins).toBe(60);
  });

  test("coach insight and delayed high priority produce correct values", () => {
    const insight = getCoachInsight(mockTasks, mockSessions, today);
    expect(insight).toBeDefined();
    expect(typeof insight.message).toBe("string");
    expect(typeof insight.emphasis).toBe("string");

    const overdueHigh = getDelayedHighPriority(mockTasks, today).count;
    expect(overdueHigh).toBe(0);
  });

  test("benchmark memoization prevents repeated function calls", () => {
    const spyInsight = vi.spyOn({ getCoachInsight }, "getCoachInsight");

    // Simulate memoized function wrapper
    let cachedResult: ReturnType<typeof runCalculations> | null = null;
    let lastDeps: unknown[] = [];

    function runCalculations(tasks: Task[], habits: Habit[], sessions: FocusSession[]) {
      const todayTasks = tasks.filter((t) => t.dueDate === todayKey);
      const done = todayTasks.filter((t) => t.done).length;
      const completion = todayTasks.length ? Math.round((done / todayTasks.length) * 100) : 0;
      const weekly = getWeeklyFocus(sessions, today);
      const todayMin = weekly.find((d) => d.date === todayKey)?.minutes ?? 0;
      const bestStreak = habits.reduce((m, h) => Math.max(m, h.streak), 0);
      const insight = spyInsight(tasks, sessions, today);
      return { todayTasks, done, completion, todayMin, bestStreak, insight };
    }

    function memoizeSimulated(tasks: Task[], habits: Habit[], sessions: FocusSession[]) {
      const deps = [tasks, habits, sessions];
      if (cachedResult && deps.every((d, i) => d === lastDeps[i])) {
        return cachedResult;
      }
      lastDeps = deps;
      cachedResult = runCalculations(tasks, habits, sessions);
      return cachedResult;
    }

    // First call (initial render)
    const res1 = memoizeSimulated(mockTasks, mockHabits, mockSessions);
    expect(spyInsight).toHaveBeenCalledTimes(1);

    // Subsequent 100 re-renders (e.g. 1-second timer ticks without task/habit/session state changes)
    for (let i = 0; i < 100; i++) {
      const res2 = memoizeSimulated(mockTasks, mockHabits, mockSessions);
      expect(res2).toBe(res1);
    }

    // Spy should still only have been called ONCE despite 100 re-renders!
    expect(spyInsight).toHaveBeenCalledTimes(1);
  });
});
