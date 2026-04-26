import { mockHabits } from "@/lib/mock-data";
import { HabitRow } from "@/components/HabitRow";
import { Plus, Flame, TrendingUp } from "lucide-react";

const Habits = () => {
  const totalStreak = mockHabits.reduce((s, h) => s + h.streak, 0);
  const completedThisWeek = mockHabits.reduce((s, h) => s + h.history.filter(Boolean).length, 0);
  const targetThisWeek = mockHabits.reduce((s, h) => s + h.target, 0);

  return (
    <div className="px-5 lg:px-10 py-6 lg:py-8 max-w-[1100px] mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">Discipline</div>
          <h1 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight">Habits</h1>
        </div>
        <button className="inline-flex items-center gap-1.5 text-sm px-4 py-2.5 rounded-xl bg-gradient-ember text-primary-foreground shadow-ember hover:opacity-95 font-bold bg-secondary-foreground">
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New habit</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-7">
        <div className="p-4 rounded-xl border border-border bg-gradient-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Total streak</span>
            <Flame className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="font-display text-2xl font-semibold">{totalStreak} days</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-gradient-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">This week</span>
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="font-display text-2xl font-semibold">{completedThisWeek}/{targetThisWeek}</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-gradient-card col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Best streak</span>
            <Flame className="h-3.5 w-3.5 text-accent" />
          </div>
          <div className="font-display text-2xl font-semibold">21 days</div>
        </div>
      </div>

      <div className="space-y-2.5">
        {mockHabits.map((h) => <HabitRow key={h.id} habit={h} />)}
      </div>
    </div>
  );
};

export default Habits;
