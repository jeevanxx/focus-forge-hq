import { mockSessions, mockTasks } from "@/lib/mock-data";
import { TrendingUp, Target, Flame, Clock } from "lucide-react";

const Analytics = () => {
  const totalMin = mockSessions.reduce((s, x) => s + x.durationMin, 0);
  const completion = Math.round((mockTasks.filter((t) => t.done).length / mockTasks.length) * 100);

  // Bar data: minutes per weekday
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const barData = days.map((_, i) => mockSessions.filter((s) => new Date(s.date).getDay() === ((i + 1) % 7)).reduce((sum, x) => sum + x.durationMin, 0));
  const maxBar = Math.max(...barData, 1);

  return (
    <div className="px-5 lg:px-10 py-6 lg:py-8 max-w-[1300px] mx-auto">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">Insight</div>
        <h1 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight">Analytics</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Focus time", value: `${(totalMin / 60).toFixed(1)}h`, sub: "this week", icon: Clock, accent: true },
          { label: "Sessions", value: `${mockSessions.length}`, sub: "completed", icon: TrendingUp },
          { label: "Completion", value: `${completion}%`, sub: "tasks done", icon: Target, accent: true },
          { label: "Streak", value: "12", sub: "days", icon: Flame },
        ].map((s) => (
          <div key={s.label} className="relative p-4 rounded-xl border border-border bg-gradient-card overflow-hidden">
            {s.accent && <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-primary/15 blur-2xl" />}
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">{s.label}</span>
                <s.icon className={`h-3.5 w-3.5 ${s.accent ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="font-display text-2xl font-semibold">{s.value}</div>
              <div className="text-[11px] text-muted-foreground">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 p-5 lg:p-6 rounded-2xl border border-border bg-gradient-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Focus minutes</div>
              <h3 className="font-display text-xl font-semibold mt-0.5">This week</h3>
            </div>
            <div className="text-xs text-muted-foreground">Goal: 180m / day</div>
          </div>
          <div className="flex items-end justify-between gap-2 h-48">
            {barData.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-primary/80 to-primary-glow shadow-ember transition-all"
                    style={{ height: `${(v / maxBar) * 100}%`, minHeight: v > 0 ? "8px" : "2px", opacity: v > 0 ? 1 : 0.2 }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 lg:p-6 rounded-2xl border border-border bg-gradient-card">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-1">Patterns</div>
          <h3 className="font-display text-xl font-semibold mb-4">What's working</h3>
          <div className="space-y-3">
            {[
              { label: "Best focus window", value: "9 – 11am" },
              { label: "Avg session", value: "42 min" },
              { label: "Most productive day", value: "Tuesday" },
              { label: "Tasks shipped", value: "23 this week" },
            ].map((p) => (
              <div key={p.label} className="flex items-center justify-between pb-3 border-b border-border last:border-0 last:pb-0">
                <span className="text-sm text-muted-foreground">{p.label}</span>
                <span className="text-sm font-semibold">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
