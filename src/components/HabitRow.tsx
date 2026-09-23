import { Habit } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, Flame, Pencil, Snowflake, Trash2 } from "lucide-react";

const colorMap = {
  ember: "from-primary to-primary-glow shadow-ember",
  amber: "from-accent to-primary",
  violet: "from-[hsl(270_70%_60%)] to-[hsl(290_70%_65%)]",
  teal: "from-[hsl(170_70%_45%)] to-[hsl(190_70%_55%)]",
};

interface Props {
  habit: Habit;
  onToggle?: (id: string) => void;
  onEdit?: (habit: Habit) => void;
  onDelete?: (id: string) => void;
}

export const HabitRow = ({ habit, onToggle, onEdit, onDelete }: Props) => {
  const completed = habit.history.filter(Boolean).length;
  const pct = Math.round((completed / Math.max(1, habit.target)) * 100);
  const doneToday = habit.history[habit.history.length - 1];

  return (
    <div className="group relative flex items-center gap-4 p-4 lg:p-5 rounded-2xl border border-border bg-gradient-card shadow-soft hover:border-border-strong hover:shadow-elev lift overflow-hidden">
      <div className={cn(
        "h-12 w-12 shrink-0 rounded-xl grid place-items-center text-xl bg-gradient-to-br ring-1 ring-white/10 group-hover:scale-105 transition-transform",
        colorMap[habit.color]
      )}>
        <span>{habit.emoji}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{habit.name}</div>
        <div className="flex items-center gap-1.5 mt-1">
          <Flame className="h-3 w-3 text-primary" />
          <span className="text-xs text-muted-foreground">
            <span className="text-foreground font-bold">{habit.streak}</span> day streak
            <span className="opacity-50"> · </span>
            <span className="text-foreground/80 font-semibold">{completed}/{habit.target}</span> this week
          </span>
          {habit.freezeActive && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[hsl(190_80%_65%)] bg-[hsl(190_80%_55%/0.12)] border border-[hsl(190_80%_55%/0.3)] rounded-md px-1.5 py-0.5"
              title="This week's streak freeze is covering one missed day"
            >
              <Snowflake className="h-2.5 w-2.5" /> Freeze
            </span>
          )}
        </div>
        <div className="mt-2 h-1 rounded-full bg-muted/60 overflow-hidden max-w-[200px]">
          <div
            className="h-full bg-gradient-ember rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      </div>

      <div className="hidden sm:flex gap-1">
        {habit.history.map((done, i) => (
          <div
            key={i}
            className={cn(
              "h-7 w-2 rounded-full transition-all",
              done
                ? "bg-gradient-to-b from-primary to-primary-deep shadow-[0_0_6px_hsl(var(--primary)/0.5)]"
                : "bg-muted border border-border"
            )}
            title={done ? "Done" : "Missed"}
          />
        ))}
      </div>

      {(onEdit || onDelete) && (
        <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={() => onEdit(habit)}
              aria-label={`Edit ${habit.name}`}
              className="press h-8 w-8 rounded-lg grid place-items-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(habit.id)}
              aria-label={`Delete ${habit.name}`}
              className="press h-8 w-8 rounded-lg grid place-items-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {onToggle && (
        <button
          onClick={() => onToggle(habit.id)}
          aria-label={doneToday ? `Undo ${habit.name} for today` : `Mark ${habit.name} done today`}
          className={cn(
            "press h-10 w-10 shrink-0 rounded-xl border-2 grid place-items-center transition-all",
            doneToday
              ? "bg-gradient-ember border-transparent shadow-ember"
              : "border-border-strong hover:border-primary/70 hover:bg-primary/10"
          )}
        >
          <Check className={cn("h-4 w-4", doneToday ? "text-primary-foreground" : "text-muted-foreground")} strokeWidth={3} />
        </button>
      )}
    </div>
  );
};
