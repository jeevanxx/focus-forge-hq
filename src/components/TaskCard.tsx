import { Task } from "@/lib/mock-data";
import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Props {
  task: Task;
  onToggle?: (id: string) => void;
}

const priorityStyles = {
  high: "bg-primary/15 text-primary border-primary/30",
  med: "bg-accent/15 text-accent border-accent/30",
  low: "bg-muted text-muted-foreground border-border",
};

const priorityLabel = { high: "High", med: "Med", low: "Low" };

export const TaskCard = ({ task, onToggle }: Props) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative flex items-start gap-3 p-4 rounded-xl border border-border bg-gradient-card",
        "shadow-soft hover:shadow-elev transition-all duration-300",
        "hover:border-primary/30",
        task.done && "opacity-55"
      )}
    >
      <button
        onClick={() => onToggle?.(task.id)}
        className={cn(
          "mt-0.5 h-5 w-5 shrink-0 rounded-md border-2 grid place-items-center transition-all",
          task.done
            ? "bg-gradient-ember border-transparent shadow-ember"
            : "border-border hover:border-primary/60"
        )}
        aria-label={task.done ? "Mark incomplete" : "Mark complete"}
      >
        {task.done && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className={cn("font-medium text-sm leading-snug", task.done && "line-through")}>
          {task.title}
        </div>
        {task.notes && (
          <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.notes}</div>
        )}
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          <span className={cn("text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border", priorityStyles[task.priority])}>
            {priorityLabel[task.priority]}
          </span>
          {task.tag && (
            <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
              {task.tag}
            </span>
          )}
          {task.estimateMin && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {task.estimateMin}m
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
