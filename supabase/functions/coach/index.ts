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

interface TaskItem {
  title?: string;
  priority?: string;
  dueDate?: string;
  estimateMin?: number;
  overdue?: boolean;
}

interface HabitItem {
  name?: string;
  streak?: number;
  doneToday?: boolean;
}

function sanitizeMessages(messages: unknown) {
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

function sanitizeContext(context: unknown) {
  const ctx = (typeof context === "object" && context !== null ? context : {}) as Record<string, unknown>;

  const tasks: TaskItem[] = Array.isArray(ctx.tasks)
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

  const habits: HabitItem[] = Array.isArray(ctx.habits)
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const messages = sanitizeMessages(body.messages);
    const context = sanitizeContext(body.context);

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
  `- ${t.title} | ${t.priority} | ${t.dueDate} | ${t.estimateMin ?? 25}m | ${t.overdue ? "OVERDUE" : "on time"}`
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
