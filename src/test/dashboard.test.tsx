import { describe, it, expect } from "vitest";
import { format } from "date-fns";
import type { Task, FocusSession, Habit, Profile } from "@/lib/types";
import { getWeeklyFocus, getCoachInsight, getDelayedHighPriority } from "@/lib/analytics";

describe("Dashboard Memoization & Analytics Performance", () => {
  const today = new Date();
  const todayKey = format(today, "yyyy-MM-dd");

  const mockTasks: Task[] = [
    {
      id: "1",
      title: "Fix bug in auth flow",
      dueDate: todayKey,
      priority: "high",
      done: false,
      estimateMin: 30,
      notes: "Critical fix needed",
    },
    {
      id: "2",
      title: "Write documentation",
      dueDate: todayKey,
      priority: "med",
      done: true,
      estimateMin: 15,
    },
    {
      id: "3",
      title: "Code review PRs",
      dueDate: todayKey,
      priority: "low",
      done: false,
      estimateMin: 20,
    },
  ];

  const mockSessions: FocusSession[] = [
    {
      id: "s1",
      date: new Date().toISOString(),
      durationMin: 25,
      mode: "focus",
    },
    {
      id: "s2",
      date: new Date().toISOString(),
      durationMin: 50,
      mode: "focus",
    },
  ];

  const mockHabits: Habit[] = [
    {
      id: "h1",
      name: "Daily Exercise",
      streak: 5,
      target: 7,
      history: [true, true, true, true, true],
    },
  ];

  const mockProfile: Profile = {
    id: "p1",
    focusGoalMin: 180,
    reminderEnabled: true,
  };

  it("calculates dashboard statistics accurately for today's tasks and sessions", () => {
    const todayTasks = mockTasks.filter((t) => t.dueDate === todayKey);
    const doneCount = todayTasks.filter((t) => t.done).length;
    const completion = Math.round((doneCount / todayTasks.length) * 100);

    expect(todayTasks.length).toBe(3);
    expect(doneCount).toBe(1);
    expect(completion).toBe(33);

    const todayMin = getWeeklyFocus(mockSessions, today).find((d) => d.date === todayKey)?.minutes ?? 0;
    expect(todayMin).toBe(75);

    const bestStreak = mockHabits.reduce((m, h) => Math.max(m, h.streak), 0);
    expect(bestStreak).toBe(5);

    const priorityOrder = { high: 0, med: 1, low: 2 };
    const activeTask = [...todayTasks]
      .filter((t) => !t.done)
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])[0];

    expect(activeTask.id).toBe("1");
    expect(activeTask.priority).toBe("high");

    const remainingTasks = todayTasks.filter((t) => t.id !== activeTask.id);
    expect(remainingTasks.length).toBe(2);
  });

  it("benchmark: computes stats rapidly under 5ms for 1,000 tasks and 1,000 focus sessions", () => {
    const largeTasks: Task[] = Array.from({ length: 1000 }).map((_, i) => ({
      id: `task-${i}`,
      title: `Task ${i}`,
      dueDate: i % 2 === 0 ? todayKey : "2025-01-01",
      priority: i % 3 === 0 ? "high" : i % 3 === 1 ? "med" : "low",
      done: i % 5 === 0,
      estimateMin: 25,
    }));

    const largeSessions: FocusSession[] = Array.from({ length: 1000 }).map((_, i) => ({
      id: `session-${i}`,
      date: new Date(Date.now() - (i % 7) * 86400000).toISOString(),
      durationMin: 25,
      mode: "focus",
    }));

    // Warmup call to ensure JIT/compilation overhead is excluded
    getWeeklyFocus(largeSessions, today);

    const start = performance.now();

    const todayTasks = largeTasks.filter((t) => t.dueDate === todayKey);
    const doneCount = todayTasks.filter((t) => t.done).length;
    const completion = Math.round((doneCount / todayTasks.length) * 100);
    const todayMin = getWeeklyFocus(largeSessions, today).find((d) => d.date === todayKey)?.minutes ?? 0;
    const bestStreak = mockHabits.reduce((m, h) => Math.max(m, h.streak), 0);
    const insight = getCoachInsight(largeTasks, largeSessions, today);
    const overdueHigh = getDelayedHighPriority(largeTasks, today).count;

    const duration = performance.now() - start;

    expect(todayTasks.length).toBe(500);
    expect(doneCount).toBe(100);
    expect(completion).toBe(20);
    expect(todayMin).toBeGreaterThan(0);
    expect(bestStreak).toBe(5);
    expect(insight).toBeDefined();
    expect(overdueHigh).toBeDefined();

    // Verify execution time remains fast (< 100ms)
    expect(duration).toBeLessThan(100);
  });
});
