export interface CoachMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CoachTaskContext {
  title: string;
  priority: string;
  dueDate: string;
  estimateMin?: number;
  overdue: boolean;
}

export interface CoachHabitContext {
  name: string;
  streak: number;
  doneToday?: boolean;
}

export interface CoachContext {
  now?: string;
  tasks?: CoachTaskContext[];
  habits?: CoachHabitContext[];
  focusMinutesToday?: number;
  focusMinutesWeek?: number;
  bestWindow?: string;
}

const MAX_MESSAGES = 10;
const MAX_CONTENT_LENGTH = 1000;
const MAX_ITEMS = 20;

/**
 * Sanitizes and bounds chat messages sent to the AI coach endpoint.
 * Prevents payload bloating, prompt injection escalation via rogue roles, and DoS.
 */
export function sanitizeMessages(messages: unknown): CoachMessage[] {
  if (!Array.isArray(messages)) {
    return [];
  }

  const validMessages: CoachMessage[] = [];

  for (const msg of messages) {
    if (!msg || typeof msg !== "object") continue;

    const role = (msg as Record<string, unknown>).role;
    const content = (msg as Record<string, unknown>).content;

    if (role !== "user" && role !== "assistant") continue;
    if (typeof content !== "string") continue;

    validMessages.push({
      role,
      content: content.slice(0, MAX_CONTENT_LENGTH),
    });
  }

  return validMessages.slice(-MAX_MESSAGES);
}

/**
 * Sanitizes and bounds client context sent to the AI coach endpoint.
 */
export function sanitizeContext(context: unknown): CoachContext {
  if (!context || typeof context !== "object") {
    return {};
  }

  const ctx = context as Record<string, unknown>;

  const rawTasks = Array.isArray(ctx.tasks) ? ctx.tasks.slice(0, MAX_ITEMS) : [];
  const tasks: CoachTaskContext[] = rawTasks.map((t) => {
    const item = (t && typeof t === "object" ? t : {}) as Record<string, unknown>;
    return {
      title: typeof item.title === "string" ? item.title.slice(0, 200) : "",
      priority: typeof item.priority === "string" ? item.priority.slice(0, 50) : "medium",
      dueDate: typeof item.dueDate === "string" ? item.dueDate.slice(0, 50) : "",
      estimateMin: typeof item.estimateMin === "number" ? Math.max(0, item.estimateMin) : 25,
      overdue: Boolean(item.overdue),
    };
  });

  const rawHabits = Array.isArray(ctx.habits) ? ctx.habits.slice(0, MAX_ITEMS) : [];
  const habits: CoachHabitContext[] = rawHabits.map((h) => {
    const item = (h && typeof h === "object" ? h : {}) as Record<string, unknown>;
    return {
      name: typeof item.name === "string" ? item.name.slice(0, 200) : "",
      streak: typeof item.streak === "number" ? Math.max(0, item.streak) : 0,
      doneToday: Boolean(item.doneToday),
    };
  });

  return {
    now: typeof ctx.now === "string" ? ctx.now.slice(0, 50) : new Date().toISOString(),
    tasks,
    habits,
    focusMinutesToday: typeof ctx.focusMinutesToday === "number" ? Math.max(0, ctx.focusMinutesToday) : 0,
    focusMinutesWeek: typeof ctx.focusMinutesWeek === "number" ? Math.max(0, ctx.focusMinutesWeek) : 0,
    bestWindow: typeof ctx.bestWindow === "string" ? ctx.bestWindow.slice(0, 100) : "unknown",
  };
}
