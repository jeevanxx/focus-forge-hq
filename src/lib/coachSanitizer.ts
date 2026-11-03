export interface CoachMessageInput {
  role?: unknown;
  content?: unknown;
}

export interface CoachTaskInput {
  title?: unknown;
  done?: unknown;
  priority?: unknown;
  dueDate?: unknown;
  estimateMin?: unknown;
  tag?: unknown;
  notes?: unknown;
  overdue?: unknown;
}

export interface CoachHabitInput {
  name?: unknown;
  streak?: unknown;
  doneToday?: unknown;
}

export interface CoachContextInput {
  now?: unknown;
  tasks?: unknown;
  habits?: unknown;
  focusMinutesToday?: unknown;
  focusMinutesWeek?: unknown;
  bestWindow?: unknown;
}

export function sanitizeMessages(messages: unknown[], maxCount = 10, maxContentLen = 1000): { role: "user" | "assistant"; content: string }[] {
  if (!Array.isArray(messages)) return [];

  return messages
    .slice(-maxCount)
    .map((msg) => {
      if (!msg || typeof msg !== "object") return null;
      const m = msg as CoachMessageInput;
      // Restrict role to user or assistant only to prevent prompt injection hijacking via system/developer roles
      const role = m.role === "assistant" ? "assistant" : "user";
      const rawContent = typeof m.content === "string" ? m.content : String(m.content ?? "");
      const content = rawContent.trim().slice(0, maxContentLen);

      if (!content) return null;
      return { role, content };
    })
    .filter((m): m is { role: "user" | "assistant"; content: string } => m !== null);
}

export function sanitizeContext(context: unknown): {
  now: string;
  tasks: Array<{ title: string; done: boolean; priority: string; dueDate: string; estimateMin: number | string; tag: string; notes: string; overdue: boolean }>;
  habits: Array<{ name: string; streak: number; doneToday: boolean }>;
  focusMinutesToday: number;
  focusMinutesWeek: number;
  bestWindow: string;
} {
  const ctx = (context && typeof context === "object" ? context : {}) as CoachContextInput;

  const now = typeof ctx.now === "string" && ctx.now.trim() ? ctx.now.trim().slice(0, 100) : new Date().toISOString();

  const rawTasks = Array.isArray(ctx.tasks) ? ctx.tasks.slice(0, 20) : [];
  const tasks = rawTasks.map((rawItem: unknown) => {
    const t = (rawItem && typeof rawItem === "object" ? rawItem : {}) as CoachTaskInput;
    return {
      title: String(t.title ?? "Untitled").trim().slice(0, 150),
      done: Boolean(t.done),
      priority: String(t.priority ?? "normal").trim().slice(0, 20),
      dueDate: String(t.dueDate ?? "").trim().slice(0, 20),
      estimateMin: typeof t.estimateMin === "number" ? t.estimateMin : String(t.estimateMin ?? "?").slice(0, 10),
      tag: String(t.tag ?? "-").trim().slice(0, 30),
      notes: String(t.notes ?? "-").trim().slice(0, 200),
      overdue: Boolean(t.overdue),
    };
  });

  const rawHabits = Array.isArray(ctx.habits) ? ctx.habits.slice(0, 20) : [];
  const habits = rawHabits.map((rawItem: unknown) => {
    const h = (rawItem && typeof rawItem === "object" ? rawItem : {}) as CoachHabitInput;
    return {
      name: String(h.name ?? "Habit").trim().slice(0, 100),
      streak: Number.isFinite(Number(h.streak)) ? Number(h.streak) : 0,
      doneToday: Boolean(h.doneToday),
    };
  });

  const focusMinutesToday = Number.isFinite(Number(ctx.focusMinutesToday)) ? Number(ctx.focusMinutesToday) : 0;
  const focusMinutesWeek = Number.isFinite(Number(ctx.focusMinutesWeek)) ? Number(ctx.focusMinutesWeek) : 0;
  const bestWindow = String(ctx.bestWindow ?? "unknown").trim().slice(0, 50);

  return {
    now,
    tasks,
    habits,
    focusMinutesToday,
    focusMinutesWeek,
    bestWindow,
  };
}
