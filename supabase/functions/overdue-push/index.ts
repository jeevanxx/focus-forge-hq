import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
import { isRequestAuthorized } from "./auth.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    // Validate request authorization to prevent unauthorized execution and resource exhaustion
    const authHeader = req.headers.get("Authorization");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const db = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey!);

    const authorized = await isRequestAuthorized(authHeader, serviceRoleKey, async (token) => {
      const { data } = await db.auth.getUser(token);
      return data;
    });

    if (!authorized) {
      return json({ error: "Unauthorized" }, 401);
    }

    webpush.setVapidDetails(
      "mailto:notifications@focusforge.app",
      Deno.env.get("VAPID_PUBLIC_KEY")!,
      Deno.env.get("VAPID_PRIVATE_KEY")!,
    );
    const today = new Date().toISOString().slice(0, 10);

    const { data: subs, error: subErr } = await db.from("push_subscriptions").select("*");
    if (subErr) throw subErr;
    if (!subs?.length) return json({ sent: 0 });
    const userIds = [...new Set(subs.map((s) => s.user_id))];

    const { data: tasks, error: tErr } = await db
      .from("tasks")
      .select("id, user_id, title, priority, due_date")
      .eq("done", false)
      .lt("due_date", today)
      .in("user_id", userIds);
    if (tErr) throw tErr;
    if (!tasks?.length) return json({ sent: 0 });

    const { data: already } = await db
      .from("push_notified")
      .select("task_id")
      .eq("notified_on", today)
      .in("task_id", tasks.map((t) => t.id));
    const done = new Set((already ?? []).map((r) => r.task_id));
    const pending = tasks.filter((t) => !done.has(t.id));
    if (!pending.length) return json({ sent: 0 });

    let sent = 0;
    for (const uid of userIds) {
      const mine = pending.filter((t) => t.user_id === uid);
      if (!mine.length) continue;
      const top = mine.sort((a, b) => (a.priority === "high" ? -1 : 0) - (b.priority === "high" ? -1 : 0))[0];
      const payload = JSON.stringify({
        title: mine.length === 1 ? "Task overdue" : `${mine.length} tasks overdue`,
        body: mine.length === 1 ? `"${top.title}" is overdue. Start it now.` : `Start with "${top.title}".`,
        url: "/tasks",
      });
      let userSent = 0;
      for (const s of subs.filter((x) => x.user_id === uid)) {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
          sent++;
          userSent++;
        } catch (e: any) {
          if (e?.statusCode === 404 || e?.statusCode === 410) {
            await db.from("push_subscriptions").delete().eq("id", s.id);
          } else console.error("push failed", e?.statusCode, e?.body);
        }
      }
      // Only mark tasks as notified when an alert was actually delivered,
      // so subscribing later the same day still gets the first alert.
      if (userSent > 0) {
        await db.from("push_notified").upsert(mine.map((t) => ({ task_id: t.id, notified_on: today })));
      }
    }
    return json({ sent });
  } catch (e) {
    console.error(e);
    return json({ error: "failed" }, 500);
  }
});

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
