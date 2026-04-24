import { mockSessions, mockTasks } from "@/lib/mock-data";
import { TrendingUp, Target, Flame, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const Analytics = () => {
  const totalMin = mockSessions.reduce((s, x) => s + x.durationMin, 0);
  const completion = Math.round((mockTasks.filter((t) => t.done).length / mockTasks.length) * 100);

  // Bar data: minutes per weekday
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const barData = days.map((_, i) => mockSessions.filter((s) => new Date(s.date).getDay() === ((i + 1) % 7)).reduce((sum, x) => sum + x.durationMin, 0));
  const maxBar = Math.max(...barData, 1);

  return (
    <div className="px-5 lg:px-12 py-8 lg:py-12 max-w-[1300px] mx-auto animate-fade-in">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-glow-primary animate-pulse" />
          <span className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground font-bold">Insight</span>
        </div>
        <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-3 text-sm lg:text-base text-muted-foreground max-w-md">
          Patterns from your last 7 days of focus and execution.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
        {[
          { label: "Focus time", value: `${(totalMin / 60).toFixed(1)}h`, sub: "this week", icon: Clock, hero: true },
          { label: "Sessions", value: `${mockSessions.length}`, sub: "completed", icon: TrendingUp, hero: false },
          { label: "Completion", value: `${completion}%`, sub: "tasks done", icon: Target, hero: true },
          { label: "Streak", value: "12", sub: "days", icon: Flame, hero: false },
        ].map((s) => (
          <div
            key={s.label}
            className={cn(
              "group relative p-5 rounded-2xl border overflow-hidden lift",
              s.hero
                ? "border-border-strong bg-gradient-primary-card shadow-elev"
                : "border-border bg-gradient-card shadow-soft hover:border-border-strong"
            )}
          >
            {s.hero && <div className="absolute -top-12 -right-10 h-32 w-32 rounded-full bg-primary/25 blur-3xl" />}
            {s.hero && <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />}
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className={cn(
                  "text-[10px] uppercase tracking-[0.22em] font-bold",
                  s.hero ? "text-primary/90" : "text-muted-foreground"
                )}>{s.label}</span>
                <s.icon className={cn("h-3.5 w-3.5", s.hero ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div className={cn("font-display font-bold tracking-tight", s.hero ? "text-4xl" : "text-2xl")}>
                {s.value}
              </div>
              <div className="text-[11px] text-muted-foreground/80 mt-1">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
        <div className="lg:col-span-2 p-6 lg:p-7 rounded-2xl border border-border-strong bg-gradient-card shadow-elev relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-bold">Focus minutes</div>
              <h3 className="font-display text-2xl font-bold mt-1 tracking-tight">This week</h3>
            </div>
            <div className="text-xs text-muted-foreground font-medium px-3 py-1.5 rounded-full bg-secondary border border-border">
              Goal: 180m / day
            </div>
          </div>
          <div className="flex items-end justify-between gap-3 h-56">
            {barData.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2.5 group">
                <div className="w-full flex-1 flex items-end relative">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-primary-deep via-primary to-primary-glow shadow-ember transition-all duration-500 group-hover:shadow-ember-lg"
                    style={{
                      height: `${(v / maxBar) * 100}%`,
                      minHeight: v > 0 ? "8px" : "2px",
                      opacity: v > 0 ? 1 : 0.15,
                    }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{days[i]}</span>
                <span className="text-[10px] text-foreground/60 font-medium tabular-nums -mt-1.5">{v > 0 ? `${v}m` : ""}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 lg:p-7 rounded-2xl border border-border bg-gradient-card shadow-soft">
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-bold mb-1">Patterns</div>
          <h3 className="font-display text-2xl font-bold mb-5 tracking-tight">What's working</h3>
          <div className="space-y-4">
            {[
              { label: "Best focus window", value: "9 – 11am" },
              { label: "Avg session", value: "42 min" },
              { label: "Most productive day", value: "Tuesday" },
              { label: "Tasks shipped", value: "23 this week" },
            ].map((p) => (
              <div key={p.label} className="flex items-center justify-between pb-4 border-b border-border last:border-0 last:pb-0">
                <span className="text-sm text-muted-foreground">{p.label}</span>
                <span className="text-sm font-bold text-foreground">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
