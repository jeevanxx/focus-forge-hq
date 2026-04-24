import { format } from "date-fns";
import { ArrowUpRight, TrendingUp, Target, Flame, Plus } from "lucide-react";
import { mockHabits, mockSessions, mockTasks } from "@/lib/mock-data";
import { TaskCard } from "@/components/TaskCard";
import { FocusTimer } from "@/components/FocusTimer";
import { HabitRow } from "@/components/HabitRow";
import { useState } from "react";

const Stat = ({ label, value, sub, icon: Icon, accent }: { label: string; value: string; sub: string; icon: any; accent?: boolean }) => (
  <div className="relative p-4 rounded-xl border border-border bg-gradient-card overflow-hidden group hover:border-primary/30 transition-colors">
    {accent && <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-primary/15 blur-2xl" />}
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">{label}</span>
        <Icon className={`h-3.5 w-3.5 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div className="font-display text-2xl font-semibold tracking-tight">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
    </div>
  </div>
);

const Dashboard = () => {
  const today = new Date();
  const [tasks, setTasks] = useState(mockTasks);
  const todayTasks = tasks.filter((t) => t.dueDate === format(today, "yyyy-MM-dd"));
  const done = todayTasks.filter((t) => t.done).length;
  const completion = todayTasks.length ? Math.round((done / todayTasks.length) * 100) : 0;
  const todayMin = mockSessions.slice(0, 4).reduce((s, x) => s + x.durationMin, 0);

  const toggle = (id: string) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  return (
    <div className="px-5 lg:px-10 py-6 lg:py-8 max-w-[1400px] mx-auto">
      {/* Greeting */}
      <div className="flex items-end justify-between mb-7">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">{format(today, "EEEE, MMM d")}</div>
          <h1 className="font-display text-3xl lg:text-5xl font-semibold tracking-tight leading-[1.05]">
            Good morning. <br className="hidden lg:block" /><span className="text-ember">Forge the day.</span>
          </h1>
        </div>
        <button className="hidden lg:inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-xl bg-gradient-ember text-primary-foreground shadow-ember hover:opacity-95 transition-opacity">
          <Plus className="h-4 w-4" /> New task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        <Stat label="Today" value={`${done}/${todayTasks.length}`} sub={`${completion}% complete`} icon={Target} accent />
        <Stat label="Focus" value={`${todayMin}m`} sub="of 180m goal" icon={TrendingUp} />
        <Stat label="Streak" value="12" sub="days unbroken" icon={Flame} accent />
        <Stat label="Sessions" value={`${mockSessions.length}`} sub="this week" icon={ArrowUpRight} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Today's tasks */}
        <div className="lg:col-span-2 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl font-semibold">Today's plan</h2>
              <span className="text-xs text-muted-foreground">{todayTasks.length} tasks · {todayTasks.reduce((s, t) => s + (t.estimateMin ?? 0), 0)}m</span>
            </div>
            <div className="space-y-2.5">
              {todayTasks.map((t) => (
                <TaskCard key={t.id} task={t} onToggle={toggle} />
              ))}
            </div>
          </div>

          {/* Habits compact */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl font-semibold">Habits</h2>
              <a href="/habits" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                View all <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
            <div className="space-y-2.5">
              {mockHabits.slice(0, 3).map((h) => (
                <HabitRow key={h.id} habit={h} />
              ))}
            </div>
          </div>
        </div>

        {/* Right column: timer + insight */}
        <div className="space-y-5">
          <FocusTimer />
          <div className="p-5 rounded-2xl border border-primary/25 bg-gradient-card relative overflow-hidden">
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative">
              <div className="text-[10px] uppercase tracking-[0.18em] text-primary font-semibold mb-1.5">Coach insight</div>
              <p className="text-sm leading-relaxed text-foreground/90">
                You ship 38% more on days you start with deep work before 10am. Protect this morning.
              </p>
              <button className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:gap-1.5 transition-all">
                Open coach <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
