export interface CoachMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CoachTaskContext {
  title: string;
  priority: string;
  dueDate: string;
  estimateMin: number;
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
const MAX_CONTENT_LENGTH = 1000;
const MAX_CONTEXT_ITEMS = 20;
const MAX_STRING_LENGTH = 200;

export function sanitizeMessages(messages: unknown): CoachMessage[] {
  if (!Array.isArray(messages)) return [];

  const validMessages: CoachMessage[] = [];

  for (const item of messages) {
    if (!item || typeof item !== "object") continue;

    const role = (item as { role?: unknown }).role;
    const rawContent = (item as { content?: unknown; text?: unknown }).content ?? (item as { text?: unknown }).text;

    if (role !== "user" && role !== "assistant") continue;
    if (typeof rawContent !== "string") continue;

    const content = rawContent.slice(0, MAX_CONTENT_LENGTH);
    validMessages.push({ role, content });
  }

  // Keep only the last MAX_MESSAGES
  return validMessages.slice(-MAX_MESSAGES);
}

export function sanitizeContext(context: unknown): CoachContext {
  if (!context || typeof context !== "object") {
    return { tasks: [], habits: [] };
  }

  const rawCtx = context as Record<string, unknown>;

  const now = typeof rawCtx.now === "string" ? rawCtx.now.slice(0, 100) : undefined;
  const bestWindow = typeof rawCtx.bestWindow === "string" ? rawCtx.bestWindow.slice(0, 100) : undefined;
  const focusMinutesToday = typeof rawCtx.focusMinutesToday === "number" ? Math.max(0, rawCtx.focusMinutesToday) : 0;
  const focusMinutesWeek = typeof rawCtx.focusMinutesWeek === "number" ? Math.max(0, rawCtx.focusMinutesWeek) : 0;

  const rawTasks = Array.isArray(rawCtx.tasks) ? rawCtx.tasks : [];
  const tasks: CoachTaskContext[] = rawTasks.slice(0, MAX_CONTEXT_ITEMS).map((t) => {
    const item = (t && typeof t === "object") ? (t as Record<string, unknown>) : {};
    return {
      title: typeof item.title === "string" ? item.title.slice(0, MAX_STRING_LENGTH) : "Untitled",
      priority: typeof item.priority === "string" ? item.priority.slice(0, 50) : "medium",
      dueDate: typeof item.dueDate === "string" ? item.dueDate.slice(0, 50) : "",
      estimateMin: typeof item.estimateMin === "number" ? Math.max(0, item.estimateMin) : 25,
      overdue: Boolean(item.overdue),
    };
  });

  const rawHabits = Array.isArray(rawCtx.habits) ? rawCtx.habits : [];
  const habits: CoachHabitContext[] = rawHabits.slice(0, MAX_CONTEXT_ITEMS).map((h) => {
    const item = (h && typeof h === "object") ? (h as Record<string, unknown>) : {};
    return {
      name: typeof item.name === "string" ? item.name.slice(0, MAX_STRING_LENGTH) : "Habit",
      streak: typeof item.streak === "number" ? Math.max(0, item.streak) : 0,
      doneToday: Boolean(item.doneToday),
    };
  });

  return {
    now,
    tasks,
    habits,
    focusMinutesToday,
    focusMinutesWeek,
    bestWindow,
  };
}
