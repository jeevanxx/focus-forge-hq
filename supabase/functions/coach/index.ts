import { createClient } from "npm:@supabase/supabase-js@2";

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
- Match the user's tone and length: short for small talk, more detail when they ask for it. Use simple markdown (bold, lists) when useful.
- The conversation includes your saved past chats with this user. Remember what they told you (goals, struggles, commitments), refer back to it naturally, and follow up on earlier advice to give personal, real advice.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const json = (b: unknown, status = 200) =>
      new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const authHeader = req.headers.get("Authorization") ?? "";
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await db.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = userData?.user;
    if (!user) return json({ error: "Please sign in." }, 401);

    const body = await req.json();
    const context = body?.context;
    const message = typeof body?.message === "string" ? body.message.trim().slice(0, 4000) : "";
    const persist = body?.persist !== false;
    if (!message) return json({ error: "Message is required." }, 400);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI is not configured." }, 500);

    // History comes only from the user's own saved messages, never from the request.
    const { data: past } = await db
      .from("coach_messages")
      .select("role, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    const messages = [
      ...(past ?? []).reverse().map((m) => ({ role: m.role, content: m.content.slice(0, 4000) })),
      { role: "user", content: message },
    ];
    if (persist) {
      await db.from("coach_messages").insert({ user_id: user.id, role: "user", content: message });
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
    await db.from("coach_messages").insert({ user_id: user.id, role: "assistant", content: reply });

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
