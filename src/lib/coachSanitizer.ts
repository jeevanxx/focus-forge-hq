export interface ChatMessage {
  role: string;
  content: string;
}

export interface SanitizedMessage {
  role: "user" | "assistant";
  content: string;
}

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

export interface CoachContext {
  now?: string;
  tasks?: TaskContext[];
  habits?: HabitContext[];
  focusMinutesToday?: number;
  focusMinutesWeek?: number;
  bestWindow?: string;
}

const MAX_MESSAGES = 10;
const MAX_CONTENT_LENGTH = 1000;
const MAX_CONTEXT_ITEMS = 20;

export function sanitizeMessages(messages: unknown): SanitizedMessage[] {
  if (!Array.isArray(messages)) return [];

  const validMessages: SanitizedMessage[] = [];

  for (const msg of messages) {
    if (!msg || typeof msg !== "object") continue;
    const { role, content } = msg as Partial<ChatMessage>;

    // Filter allowed roles only to prevent prompt injection (e.g. system role injection)
    if (role !== "user" && role !== "assistant") continue;

    const contentStr = typeof content === "string" ? content.trim() : "";
    if (!contentStr) continue;

    // Truncate content to max character limit to prevent payload bloating DoS
    validMessages.push({
      role,
      content: contentStr.slice(0, MAX_CONTENT_LENGTH),
    });
  }

  // Cap message history
  return validMessages.slice(-MAX_MESSAGES);
}

export function sanitizeContext(context: unknown): CoachContext {
  if (!context || typeof context !== "object") {
    return {
      now: new Date().toISOString(),
      tasks: [],
      habits: [],
      focusMinutesToday: 0,
      focusMinutesWeek: 0,
      bestWindow: "unknown",
    };
  }

  const ctx = context as Partial<CoachContext>;

  const sanitizeTask = (t: unknown): TaskContext => {
    if (!t || typeof t !== "object") return {};
    const taskObj = t as Partial<TaskContext>;
    return {
      title: typeof taskObj.title === "string" ? taskObj.title.trim().slice(0, 100) : "Untitled",
      priority: typeof taskObj.priority === "string" ? taskObj.priority.trim().slice(0, 20) : "medium",
      dueDate: typeof taskObj.dueDate === "string" ? taskObj.dueDate.trim().slice(0, 20) : "",
      estimateMin: typeof taskObj.estimateMin === "number" ? Math.max(0, Math.min(1440, taskObj.estimateMin)) : 25,
      overdue: Boolean(taskObj.overdue),
    };
  };

  const sanitizeHabit = (h: unknown): HabitContext => {
    if (!h || typeof h !== "object") return {};
    const habitObj = h as Partial<HabitContext>;
    return {
      name: typeof habitObj.name === "string" ? habitObj.name.trim().slice(0, 100) : "Unnamed",
      streak: typeof habitObj.streak === "number" ? Math.max(0, Math.min(10000, habitObj.streak)) : 0,
      doneToday: Boolean(habitObj.doneToday),
    };
  };

  const tasks = Array.isArray(ctx.tasks)
    ? ctx.tasks.slice(0, MAX_CONTEXT_ITEMS).map(sanitizeTask)
    : [];

  const habits = Array.isArray(ctx.habits)
    ? ctx.habits.slice(0, MAX_CONTEXT_ITEMS).map(sanitizeHabit)
    : [];

  return {
    now: typeof ctx.now === "string" ? ctx.now.slice(0, 50) : new Date().toISOString(),
    tasks,
    habits,
    focusMinutesToday: typeof ctx.focusMinutesToday === "number" ? Math.max(0, ctx.focusMinutesToday) : 0,
    focusMinutesWeek: typeof ctx.focusMinutesWeek === "number" ? Math.max(0, ctx.focusMinutesWeek) : 0,
    bestWindow: typeof ctx.bestWindow === "string" ? ctx.bestWindow.trim().slice(0, 50) : "unknown",
  };
}
