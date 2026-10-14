import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { useState } from "react";
import { TaskCard } from "@/components/TaskCard";
import { NewTaskDialog } from "@/components/NewTaskDialog";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";

const CalendarPage = () => {
  const { tasks, toggleTask } = useTasks();
  const [anchor, setAnchor] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  const selectedKey = format(selected, "yyyy-MM-dd");
  const selectedTasks = tasks.filter((t) => t.dueDate === selectedKey);

  return (
    <div className="px-5 lg:px-12 py-8 lg:py-12 max-w-[1400px] mx-auto animate-fade-in">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-glow-primary animate-pulse" />
            <span className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground font-bold">Schedule</span>
          </div>
          <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tight">{format(anchor, "MMMM yyyy")}</h1>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setAnchor(addDays(anchor, -7))} aria-label="Previous week" className="h-9 w-9 grid place-items-center rounded-lg border border-border hover:bg-secondary">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => setAnchor(addDays(anchor, 7))} aria-label="Next week" className="h-9 w-9 grid place-items-center rounded-lg border border-border hover:bg-secondary">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Week strip */}
      <div className="grid grid-cols-7 gap-2 mb-7">
        {days.map((d) => {
          const isSel = isSameDay(d, selected);
          const key = format(d, "yyyy-MM-dd");
          const tasksForDay = tasks.filter((t) => t.dueDate === key);
          return (
            <button
              key={d.toISOString()}
              onClick={() => setSelected(d)}
              className={cn(
                "relative p-3 rounded-xl border transition-all text-left",
                isSel ? "border-primary/50 bg-gradient-card shadow-ember" : "border-border bg-card hover:border-primary/30"
              )}
            >
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{format(d, "EEE")}</div>
              <div className={cn("font-display text-2xl font-semibold mt-1", isSel && "text-ember")}>{format(d, "d")}</div>
              <div className="flex gap-0.5 mt-2 h-1">
                {tasksForDay.slice(0, 4).map((t) => (
                  <div key={t.id} className={cn("h-1 w-1 rounded-full", t.priority === "high" ? "bg-primary" : "bg-muted-foreground/50")} />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Day detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl font-semibold">{format(selected, "EEEE, MMM d")}</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{selectedTasks.length} tasks</span>
              <NewTaskDialog
                defaultDate={selected}
                trigger={
                  <button className="press inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border border-border-strong bg-card hover:border-primary/50 transition-all">
                    <Plus className="h-3.5 w-3.5 text-primary" /> Add
                  </button>
                }
              />
            </div>
          </div>
          {selectedTasks.length ? (
            <div className="space-y-2.5">
              {selectedTasks.map((t) => <TaskCard key={t.id} task={t} onToggle={(id) => toggleTask.mutate(id)} />)}
            </div>
          ) : (
            <div className="p-10 text-center rounded-xl border border-dashed border-border text-muted-foreground text-sm">
              Nothing scheduled. A clear day is a gift — or an opportunity.
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="p-5 rounded-2xl border border-border bg-gradient-card">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-1.5">Workload</div>
            <h3 className="font-display text-lg font-semibold mb-3">Time needed</h3>
            {(() => {
              const open = selectedTasks.filter((t) => !t.done);
              const mins = open.reduce((s, t) => s + (t.estimateMin ?? 25), 0);
              const h = Math.floor(mins / 60);
              const m = mins % 60;
              return open.length ? (
                <div>
                  <div className="font-display text-3xl font-bold tracking-tight">
                    {h ? `${h}h ` : ""}{m}m
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    across {open.length} open {open.length === 1 ? "task" : "tasks"}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No open tasks for this day.</p>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
