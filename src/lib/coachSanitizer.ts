export interface CoachMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TaskContextItem {
  title: string;
  priority: string;
  dueDate: string;
  estimateMin: number;
  overdue: boolean;
}

export interface HabitContextItem {
  name: string;
  streak: number;
  doneToday: boolean;
}

export interface CoachContext {
  now: string;
  tasks: TaskContextItem[];
  habits: HabitContextItem[];
  focusMinutesToday: number;
  focusMinutesWeek: number;
  bestWindow: string;
}

/**
 * Sanitizes message history to prevent prompt injection role spoofing (e.g. system/developer role injection)
 * and caps array length and character lengths to mitigate resource exhaustion DoS.
 */
export function sanitizeMessages(messages: unknown): CoachMessage[] {
  if (!Array.isArray(messages)) return [];

  const validMessages: CoachMessage[] = [];

  for (const msg of messages) {
    if (!msg || typeof msg !== "object") continue;
    const role = (msg as { role?: unknown }).role;
    const content = (msg as { content?: unknown }).content;

    // Strictly restrict roles to 'user' or 'assistant' to prevent system/developer prompt injection
    if (role !== "user" && role !== "assistant") continue;
    if (typeof content !== "string") continue;

    // Cap individual message content length (max 1000 chars)
    const truncatedContent = content.slice(0, 1000);
    validMessages.push({ role, content: truncatedContent });
  }

  // Cap message history length (max 10 items) to prevent context window bloating
  return validMessages.slice(-10);
}

/**
 * Sanitizes coach context to enforce bounded array limits and prevent parameter pollution or DoS.
 */
export function sanitizeContext(context: unknown): CoachContext {
  const fallbackDate = new Date().toISOString();
  if (!context || typeof context !== "object") {
    return {
      now: fallbackDate,
      tasks: [],
      habits: [],
      focusMinutesToday: 0,
      focusMinutesWeek: 0,
      bestWindow: "unknown",
    };
  }

  const ctx = context as Record<string, unknown>;

  const rawTasks = Array.isArray(ctx.tasks) ? ctx.tasks : [];
  const tasks: TaskContextItem[] = rawTasks.slice(0, 20).map((t: Record<string, unknown>) => ({
    title: typeof t?.title === "string" ? t.title.slice(0, 200) : "Untitled",
    priority: typeof t?.priority === "string" ? t.priority.slice(0, 20) : "medium",
    dueDate: typeof t?.dueDate === "string" ? t.dueDate.slice(0, 30) : "",
    estimateMin: typeof t?.estimateMin === "number" && !isNaN(t.estimateMin) ? Math.min(Math.max(0, t.estimateMin), 1440) : 25,
    overdue: Boolean(t?.overdue),
  }));

  const rawHabits = Array.isArray(ctx.habits) ? ctx.habits : [];
  const habits: HabitContextItem[] = rawHabits.slice(0, 20).map((h: Record<string, unknown>) => ({
    name: typeof h?.name === "string" ? h.name.slice(0, 200) : "Habit",
    streak: typeof h?.streak === "number" && !isNaN(h.streak) ? Math.max(0, h.streak) : 0,
    doneToday: Boolean(h?.doneToday),
  }));

  return {
    now: typeof ctx.now === "string" ? ctx.now.slice(0, 50) : fallbackDate,
    tasks,
    habits,
    focusMinutesToday: typeof ctx.focusMinutesToday === "number" && !isNaN(ctx.focusMinutesToday) ? Math.max(0, ctx.focusMinutesToday) : 0,
    focusMinutesWeek: typeof ctx.focusMinutesWeek === "number" && !isNaN(ctx.focusMinutesWeek) ? Math.max(0, ctx.focusMinutesWeek) : 0,
    bestWindow: typeof ctx.bestWindow === "string" ? ctx.bestWindow.slice(0, 50) : "unknown",
  };
}
