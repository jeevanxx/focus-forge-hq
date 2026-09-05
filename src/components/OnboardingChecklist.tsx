import { useState } from "react";
import { Check, ListChecks, Flame, Timer, X, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";
import { useHabits } from "@/hooks/useHabits";
import { useFocusSessions } from "@/hooks/useFocusSessions";
import { useFocus } from "@/context/FocusContext";
import { NewTaskDialog } from "@/components/NewTaskDialog";
import { NewHabitDialog } from "@/components/NewHabitDialog";

const DISMISS_KEY = "ff_onboarding_dismissed";

export const OnboardingChecklist = () => {
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { habits, isLoading: habitsLoading } = useHabits();
  const { sessions, isLoading: sessionsLoading } = useFocusSessions();
  const { start } = useFocus();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === "1");

  if (dismissed || tasksLoading || habitsLoading || sessionsLoading) return null;

  const items = [
    {
      key: "task",
      done: tasks.length > 0,
      icon: ListChecks,
      title: "Add your first task",
      sub: "Put the thing you're avoiding on the board.",
      action: (
        <NewTaskDialog
          trigger={
            <button className="press inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-gradient-ember text-primary-foreground shadow-ember">
              <Plus className="h-3 w-3" strokeWidth={3} /> Add task
            </button>
          }
        />
      ),
    },
    {
      key: "habit",
      done: habits.length > 0,
      icon: Flame,
      title: "Create a daily habit",
      sub: "One repeatable action. Streak it.",
      action: (
        <NewHabitDialog
          trigger={
            <button className="press inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-gradient-ember text-primary-foreground shadow-ember">
              <Plus className="h-3 w-3" strokeWidth={3} /> New habit
            </button>
          }
        />
      ),
    },
    {
      key: "session",
      done: sessions.length > 0,
      icon: Timer,
      title: "Run a focus session",
      sub: "25 minutes. Phone down. Go.",
      action: (
        <button
          onClick={() => start({ minutes: 25, taskTitle: "First focus session" })}
          className="press inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-gradient-ember text-primary-foreground shadow-ember"
        >
          <Timer className="h-3 w-3" strokeWidth={2.5} /> Start 25m
        </button>
      ),
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  if (doneCount === items.length) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-10 rounded-2xl border border-primary/30 bg-gradient-primary-card shadow-elev p-5 lg:p-6 overflow-hidden"
    >
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/25 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold mb-1">Getting started</div>
            <h2 className="font-display text-xl font-bold tracking-tight">
              Forge your system <span className="text-muted-foreground font-semibold">· {doneCount}/{items.length}</span>
            </h2>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss getting started"
            className="press h-7 w-7 rounded-lg grid place-items-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          {items.map(({ key, done, icon: Icon, title, sub, action }) => (
            <div
              key={key}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all",
                done ? "border-border bg-card/40 opacity-60" : "border-border bg-card/70"
              )}
            >
              <div className={cn(
                "h-8 w-8 shrink-0 rounded-lg grid place-items-center border",
                done ? "bg-primary/20 border-primary/40" : "bg-secondary border-border"
              )}>
                {done ? <Check className="h-4 w-4 text-primary" strokeWidth={3} /> : <Icon className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn("text-sm font-semibold", done && "line-through text-muted-foreground")}>{title}</div>
                {!done && <div className="text-xs text-muted-foreground">{sub}</div>}
              </div>
              {!done && action}
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};
