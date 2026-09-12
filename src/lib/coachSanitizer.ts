export interface ChatMessage {
  role: string;
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
  doneToday: boolean;
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
const MAX_MESSAGE_LENGTH = 1000;
const MAX_TASKS = 20;
const MAX_HABITS = 20;
const MAX_TITLE_LENGTH = 150;

/**
 * Sanitizes input messages sent to AI coach to prevent payload bloating, DoS, and prompt injection overflow.
 */
export const sanitizeMessages = (messages: unknown): ChatMessage[] => {
  if (!Array.isArray(messages)) return [];

  // Keep only the most recent messages up to MAX_MESSAGES
  const recentMessages = messages.slice(-MAX_MESSAGES);

  return recentMessages.map((msg) => {
    const rawRole = typeof msg?.role === "string" ? msg.role : "user";
    const role = rawRole === "assistant" ? "assistant" : "user";
    const rawContent = typeof msg?.content === "string" ? msg.content : String(msg?.content ?? "");
    const content = rawContent.slice(0, MAX_MESSAGE_LENGTH);

    return { role, content };
  });
};

/**
 * Sanitizes AI coach context payload by bounding array lengths and truncating titles.
 */
export const sanitizeContext = (context: unknown): CoachContext => {
  if (!context || typeof context !== "object") {
    return {};
  }

  const ctx = context as Record<string, unknown>;

  const tasks: CoachTaskContext[] = Array.isArray(ctx.tasks)
    ? ctx.tasks.slice(0, MAX_TASKS).map((t: Record<string, unknown>) => ({
        title: String(t?.title ?? "").slice(0, MAX_TITLE_LENGTH),
        priority: String(t?.priority ?? "medium").slice(0, 20),
        dueDate: String(t?.dueDate ?? "").slice(0, 30),
        estimateMin: typeof t?.estimateMin === "number" && !isNaN(t.estimateMin) ? Math.max(0, Math.min(1440, t.estimateMin)) : 25,
        overdue: Boolean(t?.overdue),
      }))
    : [];

  const habits: CoachHabitContext[] = Array.isArray(ctx.habits)
    ? ctx.habits.slice(0, MAX_HABITS).map((h: Record<string, unknown>) => ({
        name: String(h?.name ?? "").slice(0, MAX_TITLE_LENGTH),
        streak: typeof h?.streak === "number" && !isNaN(h.streak) ? Math.max(0, h.streak) : 0,
        doneToday: Boolean(h?.doneToday),
      }))
    : [];

  return {
    now: typeof ctx.now === "string" ? ctx.now.slice(0, 50) : new Date().toISOString(),
    tasks,
    habits,
    focusMinutesToday: typeof ctx.focusMinutesToday === "number" && !isNaN(ctx.focusMinutesToday) ? Math.max(0, ctx.focusMinutesToday) : 0,
    focusMinutesWeek: typeof ctx.focusMinutesWeek === "number" && !isNaN(ctx.focusMinutesWeek) ? Math.max(0, ctx.focusMinutesWeek) : 0,
    bestWindow: typeof ctx.bestWindow === "string" ? ctx.bestWindow.slice(0, 50) : "unknown",
  };
};
