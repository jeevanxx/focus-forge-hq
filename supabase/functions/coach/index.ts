import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are "Forge Coach" — an assertive, no-nonsense productivity coach inside the Focus Forge app.

Rules of engagement:
- Be direct and commanding. Short sentences. No hedging, no therapy-speak, no "maybe you could".
- Always end with a concrete next action tied to a real task from the user's data.
- Call out avoidance when tasks are overdue. Name the task.
- Never invent tasks, habits or numbers. Only use the context provided.
- Use **bold** for the task the user should start. Keep replies under 90 words.
- If the user is genuinely clear (no open tasks), tell them to stop manufacturing work and rest.`;

interface CoachMessage {
  role: "user" | "assistant";
  content: string;
}

interface TaskItem {
  title?: unknown;
  priority?: unknown;
  dueDate?: unknown;
  estimateMin?: unknown;
  overdue?: unknown;
}

interface HabitItem {
  name?: unknown;
  streak?: unknown;
  doneToday?: unknown;
}

function sanitizeMessages(messages: unknown): CoachMessage[] {
  if (!Array.isArray(messages)) return [];

  const validMessages: CoachMessage[] = [];

  for (const msg of messages) {
    if (!msg || typeof msg !== "object") continue;
    const role = (msg as { role?: unknown }).role;
    const content = (msg as { content?: unknown }).content;

    // Strictly restrict roles to 'user' or 'assistant' to prevent prompt injection role spoofing
    if (role !== "user" && role !== "assistant") continue;
    if (typeof content !== "string") continue;

    // Cap individual message content length (max 1000 chars)
    const truncatedContent = content.slice(0, 1000);
    validMessages.push({ role, content: truncatedContent });
  }

  // Cap message history length (max 10 items) to prevent context window bloating
  return validMessages.slice(-10);
}

function sanitizeContext(context: unknown) {
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
  const tasks = rawTasks.slice(0, 20).map((t: TaskItem) => ({
    title: typeof t?.title === "string" ? t.title.slice(0, 200) : "Untitled",
    priority: typeof t?.priority === "string" ? t.priority.slice(0, 20) : "medium",
    dueDate: typeof t?.dueDate === "string" ? t.dueDate.slice(0, 30) : "",
    estimateMin: typeof t?.estimateMin === "number" && !isNaN(t.estimateMin) ? Math.min(Math.max(0, t.estimateMin), 1440) : 25,
    overdue: Boolean(t?.overdue),
  }));

  const rawHabits = Array.isArray(ctx.habits) ? ctx.habits : [];
  const habits = rawHabits.slice(0, 20).map((h: HabitItem) => ({
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    const messages = sanitizeMessages(rawBody?.messages);
    const context = sanitizeContext(rawBody?.context);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI is not configured." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contextBlock = `Current time: ${context.now}

OPEN TASKS (title | priority | due | estimate | overdue):
${context.tasks.map((t) =>
  `- ${t.title} | ${t.priority} | ${t.dueDate} | ${t.estimateMin}m | ${t.overdue ? "OVERDUE" : "on time"}`
).join("\n") || "- none"}

HABITS (name | streak | done today):
${context.habits.map((h) => `- ${h.name} | ${h.streak}d | ${h.doneToday ? "yes" : "no"}`).join("\n") || "- none"}

FOCUS: ${context.focusMinutesToday} minutes logged today, ${context.focusMinutesWeek} this week. Peak window: ${context.bestWindow}.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: contextBlock },
          ...messages,
        ],
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit hit. Try again in a moment." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Top up to keep coaching." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const detail = await response.text();
      console.error("AI gateway error", response.status, detail);
      return new Response(JSON.stringify({ error: "Coach is unavailable right now." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content ?? "Pick your top task and start. 25 minutes.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("coach error", e);
    return new Response(JSON.stringify({ error: "Unexpected error." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
