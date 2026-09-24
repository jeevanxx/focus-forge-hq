import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are "Forge Coach" — a friendly but honest productivity coach inside the Focus Forge app.

How to behave:
- Have natural, warm conversations. Chat casually, answer general questions, joke a little, and be a good listener.
- Answer ANY question about the user's tasks accurately: what's due, overdue, done, priorities, tags, notes, estimates, counts, totals, what to do first, how to break a task into steps, etc.
- Only use task, habit and focus data from the context provided. Never invent tasks or numbers. If something isn't in the data, say so.
- When the user asks for guidance or seems stuck, be direct and give a concrete next action tied to a real task, with the task in **bold**.
- Match the user's tone and length: short for small talk, more detail when they ask for it. Use simple markdown (bold, lists) when useful.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI is not configured." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contextBlock = `Current time: ${context?.now ?? new Date().toISOString()}

TASKS (title | status | priority | due | estimate | tag | notes):
${(context?.tasks ?? []).slice(0, 100).map((t: any) =>
  `- ${String(t.title).slice(0, 200)} | ${t.done ? "DONE" : t.overdue ? "OVERDUE" : "open"} | ${t.priority} | ${t.dueDate} | ${t.estimateMin ?? "?"}m | ${t.tag ?? "-"} | ${t.notes ? String(t.notes).slice(0, 300) : "-"}`
).join("\n") || "- none"}

HABITS (name | streak | done today):
${(context?.habits ?? []).map((h: any) => `- ${h.name} | ${h.streak}d | ${h.doneToday ? "yes" : "no"}`).join("\n") || "- none"}

FOCUS: ${context?.focusMinutesToday ?? 0} minutes logged today, ${context?.focusMinutesWeek ?? 0} this week. Peak window: ${context?.bestWindow ?? "unknown"}.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        reasoning_effort: "low",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: contextBlock },
          ...(Array.isArray(messages) ? messages : [])
            .filter((m: any) =>
              m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
            )
            .slice(-30)
            .map((m: any) => ({ role: m.role, content: m.content.slice(0, 4000) })),
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
