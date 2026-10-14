import { format } from "date-fns";
import { useState } from "react";
import { ArrowUpRight, TrendingUp, Target, Flame, Plus, Sparkles, Play, Zap, BellRing, X } from "lucide-react";
import { TaskCard } from "@/components/TaskCard";
import { FocusTimer } from "@/components/FocusTimer";
import { HabitRow } from "@/components/HabitRow";
import { NewTaskDialog } from "@/components/NewTaskDialog";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useTasks } from "@/hooks/useTasks";
import { useHabits } from "@/hooks/useHabits";
import { useFocusSessions } from "@/hooks/useFocusSessions";
import { useFocus } from "@/context/FocusContext";
import { getWeeklyFocus, getCoachInsight, getDelayedHighPriority } from "@/lib/analytics";
import { useProfile } from "@/hooks/useProfile";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";


/* ---------- Mini stat tile (secondary) ---------- */

const MiniStat = ({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: any;
}) => (
  <div className="group relative p-4 rounded-2xl border border-border bg-card/40 backdrop-blur-xl shadow-soft hover:border-border-strong hover:bg-card/70 lift overflow-hidden">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">{label}</span>
      <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
    </div>
    <div className="font-display text-2xl font-bold tracking-tight leading-none">{value}</div>
    <div className="text-[11px] text-muted-foreground/80 mt-1.5">{sub}</div>
  </div>
);

const Dashboard = () => {
  const today = new Date();
  const todayKey = format(today, "yyyy-MM-dd");
  const { tasks, toggleTask, toggleSubtask } = useTasks();
  const { habits, toggleToday } = useHabits();
  const { sessions } = useFocusSessions();
  const { start } = useFocus();
  const { profile } = useProfile();

  const todayTasks = tasks.filter((t) => t.dueDate === todayKey);
  const done = todayTasks.filter((t) => t.done).length;
  const completion = todayTasks.length ? Math.round((done / todayTasks.length) * 100) : 0;
  const todayMin = getWeeklyFocus(sessions, today).find((d) => d.date === todayKey)?.minutes ?? 0;
  const focusGoal = profile?.focusGoalMin ?? 180;
  const focusPct = Math.min(100, Math.round((todayMin / focusGoal) * 100));
  const bestStreak = habits.reduce((m, h) => Math.max(m, h.streak), 0);
  const insight = getCoachInsight(tasks, sessions, today);
  const [dismissedKey, setDismissedKey] = useState(() => localStorage.getItem("ff_reminder_dismissed"));

  // Gentle reminder: overdue high-priority work, or goal unmet by late afternoon.
  const overdueHigh = getDelayedHighPriority(tasks, today).count;
  const reminderMsg =
    !profile?.reminderEnabled ? null
    : overdueHigh > 0
      ? `Reminder: ${overdueHigh} high-priority ${overdueHigh === 1 ? "task is" : "tasks are"} overdue. Clear the oldest one first.`
      : today.getHours() >= 15 && todayMin < focusGoal
        ? `Reminder: you're at ${todayMin} of ${focusGoal} focus minutes. One session still gets you there.`
        : null;

  // Active task = first incomplete, sorted by priority high → med → low
  const priorityOrder = { high: 0, med: 1, low: 2 };
  const activeTask = [...todayTasks]
    .filter((t) => !t.done)
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])[0];

  // Remaining tasks (excluding active)
  const remainingTasks = todayTasks.filter((t) => t.id !== activeTask?.id);

  const toggle = (id: string) => toggleTask.mutate(id);



  return (
    <div className="px-5 lg:px-12 py-6 lg:py-10 max-w-[1400px] mx-auto animate-fade-in">
      {/* ============ HERO ZONE ============ */}
      <section className="relative mb-10 lg:mb-14">
        {/* Atmospheric backdrop */}
        <div className="absolute inset-0 -z-10 -m-6 lg:-m-10 overflow-hidden rounded-[2rem]">
          <div className="absolute inset-0 bg-gradient-glow-strong" />
          <div className="absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-primary/25 blur-3xl animate-ember-glow" />
          <div className="absolute top-10 right-10 h-56 w-56 rounded-full bg-accent/15 blur-3xl" />
        </div>

        {/* Date eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
          className="inline-flex items-center gap-2 mb-5"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-glow-primary animate-pulse" />
          <span className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground font-bold">
            {format(today, "EEEE · MMM d")}
          </span>
        </motion.div>

        {/* Greeting */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05, ease: [0.19, 1, 0.22, 1] }}
          className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.95] mb-8 lg:mb-10"
        >
          Good morning. <br />
          <span className="text-ember">Forge the day.</span>
        </motion.h1>

        {/* Main grid: ONE dominant metric + secondary */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-5">
          {/* === DOMINANT HERO METRIC === */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.19, 1, 0.22, 1] }}
            className="lg:col-span-3 relative p-6 lg:p-10 rounded-3xl border border-primary/40 bg-gradient-primary-card overflow-hidden shadow-elev-lg group"
          >
            {/* Layered glows */}
            <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary/40 blur-3xl animate-ember-glow" />
            <div className="absolute -bottom-32 -left-20 h-64 w-64 rounded-full bg-primary-deep/30 blur-3xl" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            {/* Shine sweep */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/8 to-transparent skew-x-12 animate-shine opacity-60" />
            </div>

            <div className="relative">
              <div className="flex items-start justify-between mb-6 lg:mb-8">
                <div>
                  <div className="inline-flex items-center gap-2 mb-3">
                    <span className="h-2 w-2 rounded-full bg-primary shadow-glow-primary animate-pulse" />
                    <span className="text-[11px] uppercase tracking-[0.24em] text-primary font-black">
                      Today's progress
                    </span>
                  </div>
                  <div className="text-sm text-foreground/70 font-medium">
                    Tasks shipped
                  </div>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-primary/20 border border-primary/40 grid place-items-center shadow-glow-primary backdrop-blur">
                  <Target className="h-5 w-5 text-primary" strokeWidth={2.2} />
                </div>
              </div>

              {/* Massive metric */}
              <div className="flex items-end gap-3 mb-6">
                <div className="font-display font-black tracking-tighter leading-[0.85] text-[5.5rem] lg:text-[8.5rem] text-ember">
                  {done}
                </div>
                <div className="font-display font-bold text-3xl lg:text-5xl text-muted-foreground/60 leading-none mb-3 lg:mb-5">
                  / {todayTasks.length}
                </div>
              </div>

              {/* Progress + completion */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground/70 font-medium">
                    {completion}% complete
                  </span>
                  <span className="text-muted-foreground font-medium">
                    {todayTasks.length - done} remaining
                  </span>
                </div>
                <div className="relative h-2.5 rounded-full bg-background/60 overflow-hidden border border-border">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completion}%` }}
                    transition={{ duration: 1.2, delay: 0.5, ease: [0.19, 1, 0.22, 1] }}
                    className="h-full bg-gradient-ember rounded-full relative"
                    style={{ boxShadow: "0 0 16px hsl(var(--primary) / 0.7)" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine" />
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* === SECONDARY METRICS (stacked) === */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.19, 1, 0.22, 1] }}
            className="lg:col-span-2 grid grid-cols-2 lg:grid-cols-1 gap-4"
          >
            {/* Focus minutes — smaller hero */}
            <div className="relative p-5 lg:p-6 rounded-2xl border border-border-strong bg-gradient-card-raised overflow-hidden lift shadow-elev">
              <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-primary/15 blur-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-bold">
                    Focus
                  </span>
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-4xl lg:text-5xl font-bold tracking-tight leading-none">
                    {todayMin}
                  </span>
                  <span className="text-base font-semibold text-muted-foreground">min</span>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-background/60 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${focusPct}%` }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="h-full bg-gradient-ember rounded-full"
                    style={{ boxShadow: "0 0 10px hsl(var(--primary) / 0.6)" }}
                  />
                </div>
                <div className="text-[11px] text-muted-foreground/80 mt-2">of {focusGoal}m goal</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <MiniStat label="Streak" value={`${bestStreak}`} sub="days" icon={Flame} />
              <MiniStat label="Sessions" value={`${sessions.length}`} sub="recent" icon={ArrowUpRight} />
            </div>

          </motion.div>
        </div>
      </section>

      <OnboardingChecklist />

      {/* ============ REMINDER NUDGE ============ */}
      {reminderMsg && dismissedKey !== `${todayKey}:${reminderMsg}` && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
          className="mb-10 lg:mb-14 flex items-center gap-3 p-4 rounded-2xl border border-accent/40 bg-accent/10"
        >
          <div className="h-9 w-9 shrink-0 rounded-xl bg-accent/20 border border-accent/40 grid place-items-center">
            <BellRing className="h-4 w-4 text-accent" />
          </div>
          <p className="flex-1 text-sm font-medium text-foreground/90">{reminderMsg}</p>
          <button
            aria-label="Dismiss reminder"
            onClick={() => {
              const k = `${todayKey}:${reminderMsg}`;
              localStorage.setItem("ff_reminder_dismissed", k);
              setDismissedKey(k);
            }}
            className="h-8 w-8 shrink-0 grid place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}



      {/* ============ NOW WORKING ON ============ */}
      {activeTask && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.19, 1, 0.22, 1] }}
          className="mb-10 lg:mb-14"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="relative h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
              <span className="relative h-2 w-2 rounded-full bg-primary shadow-glow-primary block" />
            </div>
            <span className="text-[11px] uppercase tracking-[0.24em] text-primary font-black">
              Now working on
            </span>
          </div>

          <div className="relative p-6 lg:p-8 rounded-3xl border border-primary/50 bg-gradient-primary-card overflow-hidden shadow-glow-primary group">
            {/* Animated glow */}
            <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl animate-ember-glow" />
            <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />

            {/* Animated border line */}
            <div className="absolute inset-0 rounded-3xl pointer-events-none opacity-50">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0 animate-shine" />
            </div>

            <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={cn(
                    "text-[10px] uppercase tracking-wider font-black px-2.5 py-1 rounded-md border",
                    activeTask.priority === "high"
                      ? "bg-primary/20 text-primary border-primary/50 shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
                      : "bg-accent/15 text-accent border-accent/40"
                  )}>
                    {activeTask.priority === "high" ? "High priority" : activeTask.priority === "med" ? "Medium" : "Low"}
                  </span>
                  {activeTask.tag && (
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md bg-secondary/80 text-secondary-foreground border border-border">
                      {activeTask.tag}
                    </span>
                  )}
                  {activeTask.estimateMin && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-semibold">
                      <Zap className="h-3 w-3 text-primary" />
                      {activeTask.estimateMin} min
                    </span>
                  )}
                </div>
                <h2 className="font-display text-3xl lg:text-4xl font-bold tracking-tight leading-tight mb-2">
                  {activeTask.title}
                </h2>
                {activeTask.notes && (
                  <p className="text-sm lg:text-base text-foreground/70 leading-relaxed max-w-xl">
                    {activeTask.notes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 lg:flex-col lg:items-stretch shrink-0">
                <button
                  onClick={() => start({ minutes: activeTask.estimateMin ?? 25, taskTitle: activeTask.title, taskId: activeTask.id })}
                  className="press inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-ember text-primary-foreground font-bold text-sm shadow-ember-lg hover:shadow-ember hover:-translate-y-0.5 transition-all whitespace-nowrap"
                >
                  <Play className="h-4 w-4 fill-current" strokeWidth={2.5} />
                  Start focus
                </button>
                <button
                  onClick={() => toggle(activeTask.id)}
                  className="press inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-card/60 backdrop-blur border border-border-strong text-foreground/90 font-semibold text-sm hover:bg-card hover:border-primary/40 transition-all"
                >
                  Mark done
                </button>

              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* ============ MAIN CONTENT GRID ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Up next */}
          <section>
            <div className="flex items-end justify-between mb-5">
              <div>
                <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-black mb-2">
                  Up next
                </div>
                <h2 className="font-display text-2xl lg:text-3xl font-bold tracking-tight">Queued for today</h2>
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {remainingTasks.length} tasks · {remainingTasks.reduce((s, t) => s + (t.estimateMin ?? 0), 0)}m
              </span>
            </div>
            <div className="space-y-2.5">
              {remainingTasks.map((t) => (
                <TaskCard key={t.id} task={t} onToggle={toggle} />
              ))}
              {!remainingTasks.length && (
                <NewTaskDialog
                  trigger={
                    <button className="w-full p-8 text-center rounded-xl border border-dashed border-border text-muted-foreground text-sm hover:border-primary/40 hover:text-foreground transition-colors">
                      Nothing queued for today. Add your first task.
                    </button>
                  }
                />
              )}
            </div>

          </section>

          {/* Habits */}
          <section>
            <div className="flex items-end justify-between mb-5">
              <div>
                <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-black mb-2">
                  Discipline
                </div>
                <h2 className="font-display text-2xl lg:text-3xl font-bold tracking-tight">Habits</h2>
              </div>
              <a
                href="/habits"
                className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 font-semibold group"
              >
                View all <ArrowUpRight className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
            <div className="space-y-2.5">
              {habits.slice(0, 3).map((h) => (
                <HabitRow key={h.id} habit={h} onToggle={(id) => toggleToday.mutate(id)} />
              ))}
              {!habits.length && (
                <div className="p-8 text-center rounded-xl border border-dashed border-border text-muted-foreground text-sm">
                  No habits yet. Start one on the Habits page.
                </div>
              )}
            </div>

          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <FocusTimer />

          <div className="relative p-6 rounded-2xl border border-primary/30 bg-gradient-primary-card overflow-hidden lift shadow-elev">
            <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/25 blur-3xl animate-ember-glow" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-primary/20 border border-primary/30 grid place-items-center shadow-glow-primary">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="text-[10px] uppercase tracking-[0.24em] text-primary font-black">
                  Coach insight
                </div>
              </div>
              <p className="text-[15px] leading-relaxed text-foreground/95 font-medium">
                {insight.message.split(insight.emphasis)[0]}
                <span className="text-ember font-bold">{insight.emphasis}</span>
                {insight.message.split(insight.emphasis)[1]}
              </p>
              <button className="press mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:gap-2 transition-all">
                Open coach <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating new-task button (desktop) */}
      <NewTaskDialog
        trigger={
          <button className="press hidden lg:inline-flex fixed bottom-8 right-24 z-30 items-center gap-2 text-sm font-bold px-5 py-3.5 rounded-2xl bg-card/70 backdrop-blur-xl border border-border-strong text-foreground shadow-elev-lg hover:border-primary/50 hover:-translate-y-0.5 transition-all">
            <Plus className="h-4 w-4 text-primary" strokeWidth={2.5} /> New task
          </button>
        }
      />

    </div>
  );
};

export default Dashboard;
