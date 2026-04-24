import { format } from "date-fns";
import { ArrowUpRight, TrendingUp, Target, Flame, Plus, Sparkles } from "lucide-react";
import { mockHabits, mockSessions, mockTasks } from "@/lib/mock-data";
import { TaskCard } from "@/components/TaskCard";
import { FocusTimer } from "@/components/FocusTimer";
import { HabitRow } from "@/components/HabitRow";
import { useState } from "react";
import { cn } from "@/lib/utils";

/* ---------- Stat tiles ---------- */

const HeroStat = ({
  label,
  value,
  sub,
  icon: Icon,
  progress,
}: {
  label: string;
  value: string;
  sub: string;
  icon: any;
  progress?: number;
}) => (
  <div className="group relative p-5 lg:p-6 rounded-2xl border border-border-strong bg-gradient-primary-card overflow-hidden lift shadow-elev">
    {/* Glow orb */}
    <div className="absolute -top-16 -right-10 h-40 w-40 rounded-full bg-primary/30 blur-3xl opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    {/* Shine sweep on hover */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-shine" />
    </div>

    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] uppercase tracking-[0.22em] text-primary/90 font-bold">{label}</span>
        <div className="h-8 w-8 rounded-lg bg-primary/15 border border-primary/25 grid place-items-center shadow-glow-primary">
          <Icon className="h-4 w-4 text-primary" strokeWidth={2.2} />
        </div>
      </div>
      <div className="font-display text-4xl lg:text-5xl font-bold tracking-tight leading-none">
        {value}
      </div>
      <div className="text-xs text-foreground/70 mt-2 font-medium">{sub}</div>

      {progress !== undefined && (
        <div className="mt-4 h-1.5 rounded-full bg-background/60 overflow-hidden">
          <div
            className="h-full bg-gradient-ember rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, progress)}%`, boxShadow: "0 0 12px hsl(var(--primary) / 0.6)" }}
          />
        </div>
      )}
    </div>
  </div>
);

const Stat = ({ label, value, sub, icon: Icon }: { label: string; value: string; sub: string; icon: any }) => (
  <div className="group relative p-4 lg:p-5 rounded-2xl border border-border bg-gradient-card overflow-hidden lift shadow-soft hover:border-border-strong">
    <div className="flex items-center justify-between mb-3">
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">{label}</span>
      <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
    </div>
    <div className="font-display text-2xl lg:text-3xl font-semibold tracking-tight">{value}</div>
    <div className="text-[11px] text-muted-foreground/80 mt-1">{sub}</div>
  </div>
);

const Dashboard = () => {
  const today = new Date();
  const [tasks, setTasks] = useState(mockTasks);
  const todayTasks = tasks.filter((t) => t.dueDate === format(today, "yyyy-MM-dd"));
  const done = todayTasks.filter((t) => t.done).length;
  const completion = todayTasks.length ? Math.round((done / todayTasks.length) * 100) : 0;
  const todayMin = mockSessions.slice(0, 4).reduce((s, x) => s + x.durationMin, 0);
  const focusGoal = 180;
  const focusPct = Math.round((todayMin / focusGoal) * 100);

  // First incomplete task = "active"
  const activeTaskId = todayTasks.find((t) => !t.done)?.id;

  const toggle = (id: string) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  return (
    <div className="px-5 lg:px-12 py-8 lg:py-12 max-w-[1400px] mx-auto animate-fade-in">
      {/* Greeting */}
      <div className="flex items-end justify-between mb-10 lg:mb-14">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-glow-primary animate-pulse" />
            <span className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground font-bold">
              {format(today, "EEEE · MMM d")}
            </span>
          </div>
          <h1 className="font-display text-4xl lg:text-6xl font-bold tracking-tight leading-[1.02]">
            Good morning. <br className="hidden lg:block" />
            <span className="text-ember">Forge the day.</span>
          </h1>
          <p className="mt-4 text-sm lg:text-base text-muted-foreground max-w-md">
            {todayTasks.length} tasks queued · {todayTasks.reduce((s, t) => s + (t.estimateMin ?? 0), 0)} minutes of intentional work.
          </p>
        </div>
        <button className="press hidden lg:inline-flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-xl bg-gradient-ember text-primary-foreground shadow-ember-lg hover:shadow-ember hover:-translate-y-0.5 transition-all">
          <Plus className="h-4 w-4" strokeWidth={2.5} /> New task
        </button>
      </div>

      {/* Stats — 2 hero + 2 secondary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-10 lg:mb-14">
        <HeroStat
          label="Today"
          value={`${done}/${todayTasks.length}`}
          sub={`${completion}% complete`}
          icon={Target}
          progress={completion}
        />
        <HeroStat
          label="Focus"
          value={`${todayMin}m`}
          sub={`of ${focusGoal}m goal`}
          icon={TrendingUp}
          progress={focusPct}
        />
        <Stat label="Streak" value="12" sub="days unbroken" icon={Flame} />
        <Stat label="Sessions" value={`${mockSessions.length}`} sub="this week" icon={ArrowUpRight} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Today's tasks */}
        <div className="lg:col-span-2 space-y-10">
          <section>
            <div className="flex items-end justify-between mb-5">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-bold mb-1.5">
                  Plan
                </div>
                <h2 className="font-display text-2xl lg:text-3xl font-bold tracking-tight">Today's work</h2>
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {todayTasks.length} tasks · {todayTasks.reduce((s, t) => s + (t.estimateMin ?? 0), 0)}m
              </span>
            </div>
            <div className="space-y-2.5">
              {todayTasks.map((t) => (
                <TaskCard key={t.id} task={t} onToggle={toggle} isActive={t.id === activeTaskId} />
              ))}
            </div>
          </section>

          {/* Habits compact */}
          <section>
            <div className="flex items-end justify-between mb-5">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-bold mb-1.5">
                  Discipline
                </div>
                <h2 className="font-display text-2xl lg:text-3xl font-bold tracking-tight">Habits</h2>
              </div>
              <a
                href="/habits"
                className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 font-medium group"
              >
                View all <ArrowUpRight className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
            <div className="space-y-2.5">
              {mockHabits.slice(0, 3).map((h) => (
                <HabitRow key={h.id} habit={h} />
              ))}
            </div>
          </section>
        </div>

        {/* Right column: timer + insight */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <FocusTimer />

          <div className={cn(
            "relative p-6 rounded-2xl border border-primary/30 bg-gradient-primary-card overflow-hidden lift shadow-elev",
          )}>
            <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/25 blur-3xl animate-ember-glow" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-primary/20 border border-primary/30 grid place-items-center shadow-glow-primary">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-primary font-bold">
                  Coach insight
                </div>
              </div>
              <p className="text-[15px] leading-relaxed text-foreground/95 font-medium">
                You ship <span className="text-ember font-bold">38% more</span> on days you start with deep work before 10am. Protect this morning.
              </p>
              <button className="press mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:gap-2 transition-all">
                Open coach <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
