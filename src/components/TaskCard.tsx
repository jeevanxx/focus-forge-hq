import { Task } from "@/lib/types";
import { Check, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Props {
  task: Task;
  onToggle?: (id: string) => void;
  isActive?: boolean;
}

const priorityStyles = {
  high: "bg-primary/15 text-primary border-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.25)]",
  med: "bg-accent/15 text-accent border-accent/40",
  low: "bg-muted text-muted-foreground border-border",
};

const priorityBar = {
  high: "bg-gradient-to-b from-primary to-primary-deep shadow-[0_0_8px_hsl(var(--primary)/0.6)]",
  med: "bg-gradient-to-b from-accent to-accent/60",
  low: "bg-border-strong",
};

const priorityLabel = { high: "High", med: "Med", low: "Low" };

export const TaskCard = ({ task, onToggle, isActive = false }: Props) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "group relative flex items-start gap-3 p-4 lg:p-5 rounded-2xl border bg-gradient-card overflow-hidden",
        "transition-all duration-300",
        isActive
          ? "border-primary/50 shadow-glow-primary bg-gradient-primary-card"
          : "border-border shadow-soft hover:border-border-strong hover:shadow-elev",
        task.done && "opacity-50"
      )}
    >
      {/* Priority bar (left edge) */}
      <div className={cn("absolute left-0 top-3 bottom-3 w-1 rounded-r-full", priorityBar[task.priority])} />

      {/* Active indicator pulse */}
      {isActive && !task.done && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/20 border border-primary/40">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shadow-glow-primary" />
          <span className="text-[9px] uppercase tracking-wider font-bold text-primary">Now</span>
        </div>
      )}

      <button
        onClick={() => onToggle?.(task.id)}
        className={cn(
          "press mt-0.5 h-5 w-5 shrink-0 rounded-md border-2 grid place-items-center transition-all ml-1",
          task.done
            ? "bg-gradient-ember border-transparent shadow-ember"
            : "border-border-strong hover:border-primary/70 hover:bg-primary/10"
        )}
        aria-label={task.done ? "Mark incomplete" : "Mark complete"}
      >
        {task.done && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className={cn(
          "font-semibold text-sm leading-snug pr-16",
          task.done && "line-through text-muted-foreground"
        )}>
          {task.title}
        </div>
        {task.notes && (
          <div className="text-xs text-muted-foreground/80 mt-1 line-clamp-1">{task.notes}</div>
        )}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className={cn(
            "text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border",
            priorityStyles[task.priority]
          )}>
            {priorityLabel[task.priority]}
          </span>
          {task.tag && (
            <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md bg-secondary/80 text-secondary-foreground border border-border">
              {task.tag}
            </span>
          )}
          {task.estimateMin && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
              <Clock className="h-3 w-3" />
              {task.estimateMin}m
            </span>
          )}
          {isActive && !task.done && (
            <span className="inline-flex items-center gap-1 text-[11px] text-primary font-semibold ml-auto">
              <Zap className="h-3 w-3" /> Focus this
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
