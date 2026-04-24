// Analytics engine for Focus Forge.
// Pure functions over Task/FocusSession arrays — swap mock arrays for
// Supabase query results in Phase 2 without touching call sites.

import { addDays, startOfWeek, isAfter, parseISO, format } from "date-fns";
import type { Task, FocusSession, Habit } from "./mock-data";

// ---------- Config ----------

export const DAILY_FOCUS_GOAL_MIN = 180; // 3h target per day
export const WEEKLY_FOCUS_GOAL_MIN = DAILY_FOCUS_GOAL_MIN * 7;
const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

// ---------- Types ----------

export interface DailyFocus {
  day: (typeof WEEK_LABELS)[number];
  date: string; // yyyy-MM-dd
  minutes: number;
}

export interface BestFocusWindow {
  startHour: number; // 0-23
  endHour: number; // exclusive
  minutes: number;
  label: string; // "9–11 AM"
  insight: string; // "You focus best between 9–11 AM."
}

export interface DelayedTasksReport {
  count: number;
  top: Task[]; // up to 3, most overdue first
}

export interface ProductivityScore {
  score: number; // 0-100
  breakdown: {
    completion: number; // 0-40
    focus: number; // 0-30
    streak: number; // 0-20
    delayPenalty: number; // 0 to -20
  };
  tier: "Forging" | "Steady" | "Warming up" | "Cold";
}

export type NextActionReason =
  | "delayed-high-priority"
  | "today-high-priority"
  | "shortest-unfinished"
  | "all-clear";

export interface NextAction {
  task: Task | null;
  reason: NextActionReason;
  message: string;
  suggestedMinutes: number;
}

// ---------- Helpers ----------

const isOverdue = (task: Task, now: Date): boolean => {
  if (task.done) return false;
  const due = parseISO(task.dueDate);
  // Overdue when "now" is past end of due day.
  const endOfDue = new Date(due);
  endOfDue.setHours(23, 59, 59, 999);
  return isAfter(now, endOfDue);
};

const isToday = (iso: string, now: Date): boolean => {
  const d = parseISO(iso);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

// ---------- 1. Weekly focus minutes ----------

export const getWeeklyFocus = (
  sessions: FocusSession[],
  now: Date = new Date()
): DailyFocus[] => {
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  return WEEK_LABELS.map((day, i) => {
    const date = addDays(weekStart, i);
    const dateKey = format(date, "yyyy-MM-dd");
    const minutes = sessions
      .filter((s) => format(parseISO(s.date), "yyyy-MM-dd") === dateKey)
      .reduce((sum, s) => sum + s.durationMin, 0);
    return { day, date: dateKey, minutes };
  });
};

export const getWeeklyFocusTotal = (sessions: FocusSession[], now?: Date): number =>
  getWeeklyFocus(sessions, now).reduce((s, d) => s + d.minutes, 0);

// ---------- 2. Completion rate ----------

export const getCompletionRate = (tasks: Task[]): number => {
  if (tasks.length === 0) return 0;
  return Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100);
};

// ---------- 3. Delayed high-priority tasks ----------

export const getDelayedHighPriority = (
  tasks: Task[],
  now: Date = new Date()
): DelayedTasksReport => {
  const delayed = tasks
    .filter((t) => t.priority === "high" && isOverdue(t, now))
    .sort(
      (a, b) =>
        parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime()
    );
  return { count: delayed.length, top: delayed.slice(0, 3) };
};

// ---------- 4. Best focus window ----------

const formatHour = (h: number): string => {
  const period = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr} ${period}`;
};

export const getBestFocusWindow = (
  sessions: FocusSession[]
): BestFocusWindow | null => {
  if (sessions.length === 0) return null;

  const hourTotals = new Array(24).fill(0) as number[];
  for (const s of sessions) {
    const hr = parseISO(s.date).getHours();
    hourTotals[hr] += s.durationMin;
  }

  let bestStart = 0;
  let bestSum = -1;
  for (let h = 0; h < 23; h++) {
    const sum = hourTotals[h] + hourTotals[h + 1];
    if (sum > bestSum) {
      bestSum = sum;
      bestStart = h;
    }
  }

  if (bestSum <= 0) return null;

  const start = formatHour(bestStart);
  const end = formatHour(bestStart + 2);
  // Compact label: "9–11 AM" when same period, else "10 AM–12 PM"
  const samePeriod = start.split(" ")[1] === end.split(" ")[1];
  const label = samePeriod
    ? `${start.split(" ")[0]}–${end.split(" ")[0]} ${end.split(" ")[1]}`
    : `${start}–${end}`;

  return {
    startHour: bestStart,
    endHour: bestStart + 2,
    minutes: bestSum,
    label,
    insight: `You focus best between ${label}.`,
  };
};

// ---------- 5. Average session length ----------

export const getAverageSessionLength = (sessions: FocusSession[]): number => {
  if (sessions.length === 0) return 0;
  const total = sessions.reduce((s, x) => s + x.durationMin, 0);
  return Math.round(total / sessions.length);
};

// ---------- 6. Productivity score ----------

const getStreakConsistency = (habits: Habit[]): number => {
  if (habits.length === 0) return 0;
  // Consistency = avg of (last-7-days completion) across habits.
  const ratios = habits.map(
    (h) => h.history.filter(Boolean).length / h.history.length
  );
  return ratios.reduce((s, r) => s + r, 0) / ratios.length; // 0-1
};

export const getProductivityScore = (
  tasks: Task[],
  sessions: FocusSession[],
  habits: Habit[],
  now: Date = new Date()
): ProductivityScore => {
  const completion = getCompletionRate(tasks) / 100; // 0-1
  const focusProgress = Math.min(
    1,
    getWeeklyFocusTotal(sessions, now) / WEEKLY_FOCUS_GOAL_MIN
  );
  const consistency = getStreakConsistency(habits);
  const delayedCount = getDelayedHighPriority(tasks, now).count;

  const completionPts = Math.round(completion * 40);
  const focusPts = Math.round(focusProgress * 30);
  const streakPts = Math.round(consistency * 20);
  const delayPenalty = Math.min(20, delayedCount * 7); // -7 per delayed, cap -20

  // Bonus 10 to balance category to 100 ceiling when everything aligned.
  const raw = completionPts + focusPts + streakPts + 10 - delayPenalty;
  const score = Math.max(0, Math.min(100, raw));

  let tier: ProductivityScore["tier"] = "Cold";
  if (score >= 80) tier = "Forging";
  else if (score >= 60) tier = "Steady";
  else if (score >= 35) tier = "Warming up";

  return {
    score,
    breakdown: {
      completion: completionPts,
      focus: focusPts,
      streak: streakPts,
      delayPenalty: -delayPenalty,
    },
    tier,
  };
};

// ---------- 7. Next best action ----------

export const getNextBestAction = (
  tasks: Task[],
  now: Date = new Date()
): NextAction => {
  const delayed = getDelayedHighPriority(tasks, now).top;
  if (delayed.length > 0) {
    const t = delayed[0];
    return {
      task: t,
      reason: "delayed-high-priority",
      message: `You've delayed "${t.title}". Start it now — 25 minutes.`,
      suggestedMinutes: 25,
    };
  }

  const todaysHigh = tasks
    .filter((t) => !t.done && t.priority === "high" && isToday(t.dueDate, now))
    .sort((a, b) => (a.estimateMin ?? 60) - (b.estimateMin ?? 60));
  if (todaysHigh.length > 0) {
    const t = todaysHigh[0];
    return {
      task: t,
      reason: "today-high-priority",
      message: `Lock in on "${t.title}" — your highest impact task today.`,
      suggestedMinutes: 25,
    };
  }

  const shortest = tasks
    .filter((t) => !t.done)
    .sort((a, b) => (a.estimateMin ?? 999) - (b.estimateMin ?? 999))[0];
  if (shortest) {
    return {
      task: shortest,
      reason: "shortest-unfinished",
      message: `Quick win: knock out "${shortest.title}" in one session.`,
      suggestedMinutes: Math.min(25, shortest.estimateMin ?? 25),
    };
  }

  return {
    task: null,
    reason: "all-clear",
    message: "You're clear. Plan tomorrow or take a real break.",
    suggestedMinutes: 0,
  };
};
