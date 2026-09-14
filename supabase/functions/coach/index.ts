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

const MAX_MESSAGES = 10;
const MAX_CONTENT_LENGTH = 1000;
const MAX_CONTEXT_ITEMS = 20;

function sanitizeMessages(messages: unknown): { role: string; content: string }[] {
  if (!Array.isArray(messages)) return [];
  const validRoles = new Set(["user", "assistant"]);
  const sanitized: { role: string; content: string }[] = [];

  for (const item of messages) {
    if (!item || typeof item !== "object") continue;
    const rawRole = String((item as Record<string, unknown>).role || "").toLowerCase().trim();
    if (!validRoles.has(rawRole)) continue;

    const rawContent = String((item as Record<string, unknown>).content || "").trim();
    sanitized.push({
      role: rawRole,
      content: rawContent.slice(0, MAX_CONTENT_LENGTH),
    });
  }

  return sanitized.slice(-MAX_MESSAGES);
}

function sanitizeContext(context: unknown) {
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

  const tasks = (Array.isArray(raw.tasks) ? raw.tasks : [])
    .slice(0, MAX_CONTEXT_ITEMS)
    .filter((t): t is Record<string, unknown> => Boolean(t) && typeof t === "object")
    .map((t) => ({
      title: String(t.title || "").slice(0, 200),
      priority: String(t.priority || "medium").slice(0, 20),
      dueDate: String(t.dueDate || "").slice(0, 30),
      estimateMin: typeof t.estimateMin === "number" && !isNaN(t.estimateMin) ? t.estimateMin : 25,
      overdue: Boolean(t.overdue),
    }));

  const habits = (Array.isArray(raw.habits) ? raw.habits : [])
    .slice(0, MAX_CONTEXT_ITEMS)
    .filter((h): h is Record<string, unknown> => Boolean(h) && typeof h === "object")
    .map((h) => ({
      name: String(h.name || "").slice(0, 200),
      streak: typeof h.streak === "number" && !isNaN(h.streak) ? Math.max(0, h.streak) : 0,
      doneToday: Boolean(h.doneToday),
    }));

  return {
    now: typeof raw.now === "string" ? raw.now.slice(0, 50) : new Date().toISOString(),
    tasks,
    habits,
    focusMinutesToday: typeof raw.focusMinutesToday === "number" && !isNaN(raw.focusMinutesToday) ? Math.max(0, Number(raw.focusMinutesToday)) : 0,
    focusMinutesWeek: typeof raw.focusMinutesWeek === "number" && !isNaN(raw.focusMinutesWeek) ? Math.max(0, Number(raw.focusMinutesWeek)) : 0,
    bestWindow: typeof raw.bestWindow === "string" ? raw.bestWindow.slice(0, 50) : "unknown",
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
