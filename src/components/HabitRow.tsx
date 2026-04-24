import { Habit } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";

const colorMap = {
  ember: "from-primary to-primary-glow",
  amber: "from-accent to-primary",
  violet: "from-[hsl(270_70%_60%)] to-[hsl(290_70%_65%)]",
  teal: "from-[hsl(170_70%_45%)] to-[hsl(190_70%_55%)]",
};

export const HabitRow = ({ habit }: { habit: Habit }) => {
  const completed = habit.history.filter(Boolean).length;
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-gradient-card hover:border-primary/30 transition-colors">
      <div className={cn("h-11 w-11 shrink-0 rounded-xl grid place-items-center text-xl bg-gradient-to-br shadow-soft", colorMap[habit.color])}>
        <span>{habit.emoji}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{habit.name}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Flame className="h-3 w-3 text-primary" />
          <span className="text-xs text-muted-foreground">
            <span className="text-foreground font-semibold">{habit.streak}</span> day streak · {completed}/{habit.target} this week
          </span>
        </div>
      </div>
      <div className="flex gap-1">
        {habit.history.map((done, i) => (
          <div
            key={i}
            className={cn(
              "h-6 w-2 rounded-full transition-all",
              done ? "bg-gradient-to-b from-primary to-primary-glow shadow-ember" : "bg-muted"
            )}
            title={done ? "Done" : "Missed"}
          />
        ))}
      </div>
    </div>
  );
};
