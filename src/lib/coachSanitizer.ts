const MAX_MESSAGES = 10;
const MAX_MSG_LENGTH = 1000;
const MAX_CONTEXT_ITEMS = 20;

export function sanitizeMessages(messages: unknown): Array<{ role: string; content: string }> {
  if (!Array.isArray(messages)) return [];
  return messages
    .slice(-MAX_MESSAGES)
    .filter((m): m is { role: unknown; content: unknown } => typeof m === "object" && m !== null)
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, MAX_MSG_LENGTH),
    }));
}

export function sanitizeContext(context: unknown): {
  safeTasks: Record<string, unknown>[];
  safeHabits: Record<string, unknown>[];
  focusMinutesToday: number;
  focusMinutesWeek: number;
  bestWindow: string;
} {
  const ctx = typeof context === "object" && context !== null ? (context as Record<string, unknown>) : {};
  const safeTasks = Array.isArray(ctx.tasks) ? ctx.tasks.slice(0, MAX_CONTEXT_ITEMS) : [];
  const safeHabits = Array.isArray(ctx.habits) ? ctx.habits.slice(0, MAX_CONTEXT_ITEMS) : [];
  return {
    safeTasks: safeTasks.filter((t): t is Record<string, unknown> => typeof t === "object" && t !== null),
    safeHabits: safeHabits.filter((h): h is Record<string, unknown> => typeof h === "object" && h !== null),
    focusMinutesToday: Number(ctx.focusMinutesToday) || 0,
    focusMinutesWeek: Number(ctx.focusMinutesWeek) || 0,
    bestWindow: String(ctx.bestWindow ?? "unknown").slice(0, 50),
  };
}
