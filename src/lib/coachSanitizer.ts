export interface CoachMessage {
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
const MAX_CONTENT_LENGTH = 1000;
const MAX_CONTEXT_ITEMS = 20;

/**
 * Sanitizes and validates user/assistant message arrays before submitting to LLM context.
 * Filters out disallowed roles (e.g., system or developer roles used in prompt injection),
 * truncates message content, and bounds message history size.
 */
export function sanitizeMessages(messages: unknown): CoachMessage[] {
  if (!Array.isArray(messages)) return [];

  const validRoles = new Set(["user", "assistant"]);
  const sanitized: CoachMessage[] = [];

  for (const item of messages) {
    if (!item || typeof item !== "object") continue;

    const rawRole = String((item as { role?: unknown }).role || "").toLowerCase().trim();
    if (!validRoles.has(rawRole)) continue;

    const rawContent = String((item as { content?: unknown }).content || "").trim();
    const truncatedContent = rawContent.slice(0, MAX_CONTENT_LENGTH);

    sanitized.push({
      role: rawRole as "user" | "assistant",
      content: truncatedContent,
    });
  }

  return sanitized.slice(-MAX_MESSAGES);
}

/**
 * Bounds and sanitizes structured context passed to the AI coach endpoint.
 * Restricts array sizes to prevent memory allocation DoS and limits field lengths.
 */
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

  const raw = context as Record<string, unknown>;

  const sanitizeTask = (t: unknown): CoachTaskContext | null => {
    if (!t || typeof t !== "object") return null;
    const taskObj = t as Record<string, unknown>;
    return {
      title: String(taskObj.title || "").slice(0, 200),
      priority: String(taskObj.priority || "medium").slice(0, 20),
      dueDate: String(taskObj.dueDate || "").slice(0, 30),
      estimateMin: typeof taskObj.estimateMin === "number" && !isNaN(taskObj.estimateMin) ? taskObj.estimateMin : 25,
      overdue: Boolean(taskObj.overdue),
    };
  };

  const sanitizeHabit = (h: unknown): CoachHabitContext | null => {
    if (!h || typeof h !== "object") return null;
    const habitObj = h as Record<string, unknown>;
    return {
      name: String(habitObj.name || "").slice(0, 200),
      streak: typeof habitObj.streak === "number" && !isNaN(habitObj.streak) ? Math.max(0, habitObj.streak) : 0,
      doneToday: Boolean(habitObj.doneToday),
    };
  };

  const rawTasks = Array.isArray(raw.tasks) ? raw.tasks : [];
  const tasks = rawTasks
    .slice(0, MAX_CONTEXT_ITEMS)
    .map(sanitizeTask)
    .filter((t): t is CoachTaskContext => t !== null);

  const rawHabits = Array.isArray(raw.habits) ? raw.habits : [];
  const habits = rawHabits
    .slice(0, MAX_CONTEXT_ITEMS)
    .map(sanitizeHabit)
    .filter((h): h is CoachHabitContext => h !== null);

  return {
    now: typeof raw.now === "string" ? raw.now.slice(0, 50) : new Date().toISOString(),
    tasks,
    habits,
    focusMinutesToday: typeof raw.focusMinutesToday === "number" && !isNaN(raw.focusMinutesToday) ? Math.max(0, raw.focusMinutesToday) : 0,
    focusMinutesWeek: typeof raw.focusMinutesWeek === "number" && !isNaN(raw.focusMinutesWeek) ? Math.max(0, raw.focusMinutesWeek) : 0,
    bestWindow: typeof raw.bestWindow === "string" ? raw.bestWindow.slice(0, 50) : "unknown",
  };
}
