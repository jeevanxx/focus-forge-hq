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

interface TaskContext {
  title?: string;
  priority?: string;
  dueDate?: string;
  estimateMin?: number;
  overdue?: boolean;
}

interface HabitContext {
  name?: string;
  streak?: number;
  doneToday?: boolean;
}

interface CoachContext {
  now?: string;
  tasks?: TaskContext[];
  habits?: HabitContext[];
  focusMinutesToday?: number;
  focusMinutesWeek?: number;
  bestWindow?: string;
}

interface ChatMessage {
  role: string;
  content: string;
}

interface SanitizedMessage {
  role: "user" | "assistant";
  content: string;
}

function sanitizeMessages(messages: unknown): SanitizedMessage[] {
  if (!Array.isArray(messages)) return [];
  const validMessages: SanitizedMessage[] = [];
  for (const msg of messages) {
    if (!msg || typeof msg !== "object") continue;
    const { role, content } = msg as Partial<ChatMessage>;
    // Prevent prompt injection (e.g. system role injection)
    if (role !== "user" && role !== "assistant") continue;
    const contentStr = typeof content === "string" ? content.trim() : "";
    if (!contentStr) continue;
    validMessages.push({
      role,
      content: contentStr.slice(0, 1000), // Max content length
    });
  }
  return validMessages.slice(-10); // Max message history
}

function sanitizeContext(context: unknown): CoachContext {
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

  return {
    now: typeof ctx.now === "string" ? ctx.now.slice(0, 50) : new Date().toISOString(),
    tasks: Array.isArray(ctx.tasks) ? ctx.tasks.slice(0, 20).map(sanitizeTask) : [],
    habits: Array.isArray(ctx.habits) ? ctx.habits.slice(0, 20).map(sanitizeHabit) : [],
    focusMinutesToday: typeof ctx.focusMinutesToday === "number" ? Math.max(0, ctx.focusMinutesToday) : 0,
    focusMinutesWeek: typeof ctx.focusMinutesWeek === "number" ? Math.max(0, ctx.focusMinutesWeek) : 0,
    bestWindow: typeof ctx.bestWindow === "string" ? ctx.bestWindow.trim().slice(0, 50) : "unknown",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI is not configured." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messages = sanitizeMessages(rawBody?.messages);
    const context = sanitizeContext(rawBody?.context);

    const contextBlock = `Current time: ${context.now}

OPEN TASKS (title | priority | due | estimate | overdue):
${(context.tasks ?? []).map((t) =>
  `- ${t.title} | ${t.priority} | ${t.dueDate} | ${t.estimateMin ?? 25}m | ${t.overdue ? "OVERDUE" : "on time"}`
).join("\n") || "- none"}

HABITS (name | streak | done today):
${(context.habits ?? []).map((h) => `- ${h.name} | ${h.streak}d | ${h.doneToday ? "yes" : "no"}`).join("\n") || "- none"}

FOCUS: ${context.focusMinutesToday ?? 0} minutes logged today, ${context.focusMinutesWeek ?? 0} this week. Peak window: ${context.bestWindow ?? "unknown"}.`;

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
