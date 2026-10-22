import { useState, useCallback } from "react";
import { HabitRow } from "@/components/HabitRow";
import { NewHabitDialog } from "@/components/NewHabitDialog";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { Plus, Flame, TrendingUp } from "lucide-react";
import { useHabits } from "@/hooks/useHabits";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import type { Habit } from "@/lib/types";

const Habits = () => {
  const { habits, isLoading, toggleToday, deleteHabit } = useHabits();
  const [editing, setEditing] = useState<Habit | null>(null);
  const [deleting, setDeleting] = useState<Habit | null>(null);

  const totalStreak = habits.reduce((s, h) => s + h.streak, 0);
  const completedThisWeek = habits.reduce((s, h) => s + h.history.filter(Boolean).length, 0);
  const targetThisWeek = habits.reduce((s, h) => s + h.target, 0);
  const bestStreak = habits.reduce((m, h) => Math.max(m, h.streak), 0);

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteHabit.mutateAsync(deleting.id);
      toast({ title: "Habit deleted" });
      setDeleting(null);
    } catch (err) {
      toast({ title: "Could not delete habit", description: (err as Error).message, variant: "destructive" });
    }
  };

  // Stabilize callbacks passed to memoized HabitRow components to prevent re-renders
  const handleToggle = useCallback((id: string) => {
    toggleToday.mutate(id);
  }, [toggleToday]);

  const handleEdit = useCallback((habit: Habit) => {
    setEditing(habit);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setDeleting(habits.find((x) => x.id === id) ?? null);
  }, [habits]);

  return (
    <div className="px-5 lg:px-12 py-8 lg:py-12 max-w-[1200px] mx-auto animate-fade-in">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-glow-primary animate-pulse" />
            <span className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground font-bold">Discipline</span>
          </div>
          <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tight">Habits</h1>
        </div>
        <NewHabitDialog
          trigger={
            <button className="press inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-xl bg-gradient-ember text-primary-foreground shadow-ember hover:shadow-ember-lg hover:-translate-y-0.5 transition-all">
              <Plus className="h-4 w-4" strokeWidth={2.5} /> <span className="hidden sm:inline">New habit</span>
            </button>
          }
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mb-8">
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
          <div className="font-display text-2xl font-semibold">{bestStreak} days</div>
        </div>
      </div>

      <div className="space-y-2.5">
        {isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        {!isLoading && habits.map((h) => (
          <HabitRow
            key={h.id}
            habit={h}
            onToggle={handleToggle}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
        {!isLoading && !habits.length && (
          <div className="p-12 text-center rounded-xl border border-dashed border-border text-muted-foreground text-sm">
            No habits yet. Pick one you can repeat daily and start the streak today.
          </div>
        )}
      </div>

      {editing && (
        <NewHabitDialog
          habit={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this habit?"
        description={deleting ? `"${deleting.name}" and its check-in history will be removed.` : ""}
        onConfirm={confirmDelete}
        pending={deleteHabit.isPending}
      />
    </div>
  );
};

export default Habits;
