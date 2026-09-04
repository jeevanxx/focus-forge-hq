export interface SanitizedCoachMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TaskContextItem {
  title?: unknown;
  priority?: unknown;
  dueDate?: unknown;
  estimateMin?: unknown;
  overdue?: unknown;
}

export interface HabitContextItem {
  name?: unknown;
  streak?: unknown;
  doneToday?: unknown;
}

export interface RawCoachContext {
  now?: unknown;
  tasks?: TaskContextItem[];
  habits?: HabitContextItem[];
  focusMinutesToday?: unknown;
  focusMinutesWeek?: unknown;
  bestWindow?: unknown;
}

export interface SanitizedCoachContext {
  now: string;
  tasks: Array<{
    title: string;
    priority: string;
    dueDate: string;
    estimateMin: number;
    overdue: boolean;
  }>;
  habits: Array<{
    name: string;
    streak: number;
    doneToday: boolean;
  }>;
  focusMinutesToday: number;
  focusMinutesWeek: number;
  bestWindow: string;
}

/**
 * Sanitizes input message list for AI coach API requests.
 * Caps length to max 10 messages, content length to max 1000 chars per message,
 * and restricts allowed roles to 'user' or 'assistant'.
 */
export function sanitizeMessages(messages: unknown): SanitizedCoachMessage[] {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter((m): m is Record<string, unknown> => typeof m === "object" && m !== null)
    .map((m) => {
      const role = m.role === "assistant" ? ("assistant" as const) : ("user" as const);
      const rawContent = typeof m.content === "string" ? m.content : typeof m.text === "string" ? m.text : "";
      const content = rawContent.trim().slice(0, 1000);
      return { role, content };
    })
    .filter((m) => m.content.length > 0)
    .slice(-10);
}

/**
 * Sanitizes context payload for AI coach API requests.
 * Caps tasks/habits array lengths, bounds numeric ranges, and truncates string values.
 */
export function sanitizeContext(context: RawCoachContext | unknown): SanitizedCoachContext {
  const ctx = typeof context === "object" && context !== null ? (context as RawCoachContext) : {};

  const now = typeof ctx.now === "string" ? ctx.now.slice(0, 50) : new Date().toISOString();

  const tasks = Array.isArray(ctx.tasks)
    ? ctx.tasks.slice(0, 20).map((t) => ({
        title: typeof t?.title === "string" ? t.title.slice(0, 200) : "Untitled",
        priority: typeof t?.priority === "string" ? t.priority.slice(0, 20) : "medium",
        dueDate: typeof t?.dueDate === "string" ? t.dueDate.slice(0, 30) : "",
        estimateMin: typeof t?.estimateMin === "number" && !isNaN(t.estimateMin)
          ? Math.min(Math.max(Math.floor(t.estimateMin), 0), 1440)
          : 25,
        overdue: Boolean(t?.overdue),
      }))
    : [];

  const habits = Array.isArray(ctx.habits)
    ? ctx.habits.slice(0, 20).map((h) => ({
        name: typeof h?.name === "string" ? h.name.slice(0, 200) : "Habit",
        streak: typeof h?.streak === "number" && !isNaN(h.streak) ? Math.max(Math.floor(h.streak), 0) : 0,
        doneToday: Boolean(h?.doneToday),
      }))
    : [];

  const focusMinutesToday =
    typeof ctx.focusMinutesToday === "number" && !isNaN(ctx.focusMinutesToday)
      ? Math.max(Math.floor(ctx.focusMinutesToday), 0)
      : 0;

  const focusMinutesWeek =
    typeof ctx.focusMinutesWeek === "number" && !isNaN(ctx.focusMinutesWeek)
      ? Math.max(Math.floor(ctx.focusMinutesWeek), 0)
      : 0;

  const bestWindow = typeof ctx.bestWindow === "string" ? ctx.bestWindow.slice(0, 50) : "unknown";

  return {
    now,
    tasks,
    habits,
    focusMinutesToday,
    focusMinutesWeek,
    bestWindow,
  };
}
