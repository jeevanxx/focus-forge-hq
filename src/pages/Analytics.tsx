import { mockSessions, mockTasks, mockHabits } from "@/lib/mock-data";
import {
  getWeeklyFocus,
  getWeeklyFocusTotal,
  getCompletionRate,
  getDelayedHighPriority,
  getBestFocusWindow,
  getAverageSessionLength,
  getProductivityScore,
  getNextBestAction,
  DAILY_FOCUS_GOAL_MIN,
} from "@/lib/analytics";
import {
  TrendingUp,
  Target,
  Flame,
  Clock,
  AlertTriangle,
  Sunrise,
  Play,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const Analytics = () => {
  const now = new Date();

  const weekly = getWeeklyFocus(mockSessions, now);
  const totalMin = weekly.reduce((sum, day) => sum + day.minutes, 0);
  const completion = getCompletionRate(mockTasks);
  const delayed = getDelayedHighPriority(mockTasks, now);
  const window = getBestFocusWindow(mockSessions);
  const avgSession = getAverageSessionLength(mockSessions);
  const score = getProductivityScore(mockTasks, mockSessions, mockHabits, now);
  const next = getNextBestAction(mockTasks, now);

  const maxBar = Math.max(...weekly.map((d) => d.minutes), 1);
  const goalPct = Math.min(100, Math.round((totalMin / (DAILY_FOCUS_GOAL_MIN * 7)) * 100));

  const tierColor =
    score.tier === "Forging"
      ? "text-primary"
      : score.tier === "Steady"
      ? "text-foreground"
      : score.tier === "Warming up"
      ? "text-amber-400"
      : "text-muted-foreground";

  return (
    <div className="px-5 lg:px-12 py-8 lg:py-12 max-w-[1300px] mx-auto animate-fade-in">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-glow-primary animate-pulse" />
          <span className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground font-bold">
            Insight
          </span>
        </div>
        <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tight">
          Analytics
        </h1>
        <p className="mt-3 text-sm lg:text-base text-muted-foreground max-w-md">
          Real metrics from your last 7 days of focus and execution.
        </p>
      </div>

      {/* HERO: Productivity score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 mb-6">
        <div className="lg:col-span-2 relative overflow-hidden rounded-3xl border border-border-strong bg-gradient-primary-card shadow-elev-lg p-7 lg:p-9">
          <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-primary/30 blur-3xl animate-pulse" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] uppercase tracking-[0.24em] text-primary/90 font-bold">
                Productivity score
              </span>
            </div>
            <div className="flex items-end gap-5 mb-6">
              <div className="font-display font-bold tracking-tighter leading-none text-7xl lg:text-8xl">
                {score.score}
              </div>
              <div className="pb-2">
                <div className={cn("font-display text-2xl font-bold", tierColor)}>
                  {score.tier}
                </div>
                <div className="text-xs text-muted-foreground">out of 100</div>
              </div>
            </div>

            {/* Score bar */}
            <div className="relative h-2 rounded-full bg-secondary/60 overflow-hidden mb-6">
              <div
                className="h-full bg-gradient-to-r from-primary-deep via-primary to-primary-glow shadow-ember"
                style={{ width: `${score.score}%` }}
              />
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Completion", value: `+${score.breakdown.completion}`, max: 40 },
                { label: "Focus", value: `+${score.breakdown.focus}`, max: 30 },
                { label: "Streaks", value: `+${score.breakdown.streak}`, max: 20 },
                {
                  label: "Delays",
                  value: score.breakdown.delayPenalty.toString(),
                  max: 20,
                  negative: true,
                },
              ].map((b) => (
                <div key={b.label} className="rounded-xl border border-border bg-card/40 backdrop-blur-sm p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                    {b.label}
                  </div>
                  <div
                    className={cn(
                      "font-display text-xl font-bold tabular-nums mt-0.5",
                      b.negative ? "text-destructive" : "text-foreground"
                    )}
                  >
                    {b.value}
                  </div>
                  <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                    of {b.max}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Next best action */}
        <div className="relative overflow-hidden rounded-3xl border border-border-strong bg-gradient-card shadow-elev p-6 lg:p-7 flex flex-col">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="flex items-center gap-2 mb-3">
            <ArrowRight className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] uppercase tracking-[0.24em] text-primary/90 font-bold">
              Next best action
            </span>
          </div>
          {next.task ? (
            <>
              <h3 className="font-display text-xl font-bold tracking-tight leading-snug mb-2">
                {next.task.title}
              </h3>
              <p className="text-sm text-muted-foreground flex-1 mb-5">
                {next.message}
              </p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary-deep via-primary to-primary-glow shadow-ember hover:shadow-ember-lg press w-full"
              >
                <Play className="h-4 w-4 mr-2 fill-current" />
                Start {next.suggestedMinutes} min
              </Button>
            </>
          ) : (
            <>
              <h3 className="font-display text-xl font-bold tracking-tight mb-2">
                You're clear
              </h3>
              <p className="text-sm text-muted-foreground flex-1">{next.message}</p>
            </>
          )}
        </div>
      </div>

      {/* Delayed high-priority warning */}
      {delayed.count > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-destructive/40 bg-destructive/10 p-5 lg:p-6 mb-6">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-destructive/50 to-transparent" />
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-destructive/20 border border-destructive/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-[0.22em] text-destructive font-bold">
                  Reality check
                </span>
              </div>
              <h3 className="font-display text-lg font-bold tracking-tight mb-2">
                {delayed.count} high-priority task{delayed.count > 1 ? "s" : ""} overdue
              </h3>
              <ul className="space-y-1.5">
                {delayed.top.map((t) => (
                  <li
                    key={t.id}
                    className="text-sm text-foreground/80 flex items-center gap-2"
                  >
                    <span className="h-1 w-1 rounded-full bg-destructive" />
                    <span className="truncate">{t.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        {[
          {
            label: "Focus time",
            value: `${(totalMin / 60).toFixed(1)}h`,
            sub: `${goalPct}% of goal`,
            icon: Clock,
          },
          {
            label: "Sessions",
            value: `${mockSessions.length}`,
            sub: "completed",
            icon: TrendingUp,
          },
          {
            label: "Completion",
            value: `${completion}%`,
            sub: "tasks done",
            icon: Target,
          },
          {
            label: "Avg session",
            value: `${avgSession}m`,
            sub: "per block",
            icon: Flame,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="group relative p-5 rounded-2xl border border-border bg-gradient-card shadow-soft hover:border-border-strong lift overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-bold">
                {s.label}
              </span>
              <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="font-display text-2xl font-bold tracking-tight">
              {s.value}
            </div>
            <div className="text-[11px] text-muted-foreground/80 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Weekly chart + best window */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
        <div className="lg:col-span-2 p-6 lg:p-7 rounded-2xl border border-border-strong bg-gradient-card shadow-elev relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-bold">
                Focus minutes
              </div>
              <h3 className="font-display text-2xl font-bold mt-1 tracking-tight">
                This week
              </h3>
            </div>
            <div className="text-xs text-muted-foreground font-medium px-3 py-1.5 rounded-full bg-secondary border border-border">
              Goal: {DAILY_FOCUS_GOAL_MIN}m / day
            </div>
          </div>
          <div className="flex items-end justify-between gap-3 h-56">
            {weekly.map((d) => (
              <div
                key={d.date}
                className="flex-1 flex flex-col items-center gap-2.5 group"
              >
                <div className="w-full flex-1 flex items-end relative">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-primary-deep via-primary to-primary-glow shadow-ember transition-all duration-500 group-hover:shadow-ember-lg"
                    style={{
                      height: `${(d.minutes / maxBar) * 100}%`,
                      minHeight: d.minutes > 0 ? "8px" : "2px",
                      opacity: d.minutes > 0 ? 1 : 0.15,
                    }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  {d.day}
                </span>
                <span className="text-[10px] text-foreground/60 font-medium tabular-nums -mt-1.5">
                  {d.minutes > 0 ? `${d.minutes}m` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Best focus window */}
        <div className="relative overflow-hidden p-6 lg:p-7 rounded-2xl border border-border-strong bg-gradient-card shadow-elev">
          <div className="absolute -top-16 -right-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Sunrise className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] uppercase tracking-[0.22em] text-primary/90 font-bold">
                Peak window
              </span>
            </div>
            {window ? (
              <>
                <div className="font-display text-4xl lg:text-5xl font-bold tracking-tighter mb-2">
                  {window.label}
                </div>
                <p className="text-sm text-muted-foreground mb-5">
                  {window.insight} You log {window.minutes}m of focus in this window.
                </p>
                <div className="pt-4 border-t border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Avg session</span>
                    <span className="text-sm font-bold tabular-nums">
                      {avgSession} min
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Sessions this week
                    </span>
                    <span className="text-sm font-bold tabular-nums">
                      {mockSessions.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Goal progress
                    </span>
                    <span className="text-sm font-bold tabular-nums">{goalPct}%</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Not enough sessions yet to detect your peak window.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
