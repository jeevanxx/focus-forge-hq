export interface TaskContext {
  title?: string;
  priority?: string;
  dueDate?: string;
  estimateMin?: number;
  overdue?: boolean;
}

export interface HabitContext {
  name?: string;
  streak?: number;
  doneToday?: boolean;
}

export interface SanitizedContext {
  now: string;
  tasks: TaskContext[];
  habits: HabitContext[];
  focusMinutesToday: number;
  focusMinutesWeek: number;
  bestWindow: string;
}

export interface SanitizedMessage {
  role: "user" | "assistant";
  content: string;
}

export function sanitizeMessages(messages: unknown): SanitizedMessage[] {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter(
      (msg): msg is { role: string; content: string } =>
        typeof msg === "object" &&
        msg !== null &&
        "content" in msg &&
        typeof (msg as { content?: unknown }).content === "string" &&
        "role" in msg &&
        ((msg as { role?: unknown }).role === "user" || (msg as { role?: unknown }).role === "assistant")
    )
    .slice(-10)
    .map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: String(msg.content).slice(0, 1000),
    }));
}

export function sanitizeContext(context: unknown): SanitizedContext {
  const ctx = (typeof context === "object" && context !== null ? context : {}) as Record<string, unknown>;

  const tasks = Array.isArray(ctx.tasks)
    ? ctx.tasks.slice(0, 20).map((t) => {
        const item = (typeof t === "object" && t !== null ? t : {}) as Record<string, unknown>;
        return {
          title: typeof item.title === "string" ? item.title.slice(0, 200) : "Untitled",
          priority: typeof item.priority === "string" ? item.priority.slice(0, 50) : "medium",
          dueDate: typeof item.dueDate === "string" ? item.dueDate.slice(0, 50) : "",
          estimateMin: typeof item.estimateMin === "number" ? item.estimateMin : 25,
          overdue: Boolean(item.overdue),
        };
      })
    : [];

  const habits = Array.isArray(ctx.habits)
    ? ctx.habits.slice(0, 20).map((h) => {
        const item = (typeof h === "object" && h !== null ? h : {}) as Record<string, unknown>;
        return {
          name: typeof item.name === "string" ? item.name.slice(0, 200) : "Unnamed",
          streak: typeof item.streak === "number" ? item.streak : 0,
          doneToday: Boolean(item.doneToday),
        };
      })
    : [];

  return {
    now: typeof ctx.now === "string" ? ctx.now.slice(0, 100) : new Date().toISOString(),
    tasks,
    habits,
    focusMinutesToday: typeof ctx.focusMinutesToday === "number" ? ctx.focusMinutesToday : 0,
    focusMinutesWeek: typeof ctx.focusMinutesWeek === "number" ? ctx.focusMinutesWeek : 0,
    bestWindow: typeof ctx.bestWindow === "string" ? ctx.bestWindow.slice(0, 50) : "unknown",
  };
}
