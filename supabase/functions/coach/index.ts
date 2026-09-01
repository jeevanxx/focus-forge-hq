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

    const sanitizeMsg = (msgs: unknown[]) => {
      if (!Array.isArray(msgs)) return [];
      return msgs
        .filter((m) => m && typeof m === "object" && ((m as Record<string, unknown>).role === "user" || (m as Record<string, unknown>).role === "assistant") && typeof (m as Record<string, unknown>).content === "string")
        .map((m) => {
          const item = m as Record<string, unknown>;
          return { role: item.role as "user" | "assistant", content: String(item.content).slice(0, 1000) };
        })
        .slice(-10);
    };

    const ctx = rawBody?.context && typeof rawBody.context === "object" ? (rawBody.context as Record<string, unknown>) : {};
    const messages = sanitizeMsg(Array.isArray(rawBody?.messages) ? rawBody.messages : []);

    const tasks = Array.isArray(ctx.tasks) ? ctx.tasks.slice(0, 20) : [];
    const habits = Array.isArray(ctx.habits) ? ctx.habits.slice(0, 20) : [];

    const contextBlock = `Current time: ${typeof ctx.now === "string" ? ctx.now.slice(0, 50) : new Date().toISOString()}

OPEN TASKS (title | priority | due | estimate | overdue):
${tasks.map((t) => {
  const item = (t && typeof t === "object" ? t : {}) as Record<string, unknown>;
  return `- ${String(item.title ?? "").slice(0, 200)} | ${String(item.priority ?? "medium").slice(0, 50)} | ${String(item.dueDate ?? "").slice(0, 50)} | ${Number(item.estimateMin) || 25}m | ${item.overdue ? "OVERDUE" : "on time"}`;
}).join("\n") || "- none"}

HABITS (name | streak | done today):
${habits.map((h) => {
  const item = (h && typeof h === "object" ? h : {}) as Record<string, unknown>;
  return `- ${String(item.name ?? "").slice(0, 200)} | ${Number(item.streak) || 0}d | ${item.doneToday ? "yes" : "no"}`;
}).join("\n") || "- none"}

FOCUS: ${Number(ctx.focusMinutesToday) || 0} minutes logged today, ${Number(ctx.focusMinutesWeek) || 0} this week. Peak window: ${String(ctx.bestWindow ?? "unknown").slice(0, 100)}.`;

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
