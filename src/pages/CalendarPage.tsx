import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { useState } from "react";
import { mockTasks } from "@/lib/mock-data";
import { TaskCard } from "@/components/TaskCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const CalendarPage = () => {
  const [anchor, setAnchor] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  const selectedTasks = mockTasks.filter((t) => isSameDay(new Date(t.dueDate), selected));

  return (
    <div className="px-5 lg:px-10 py-6 lg:py-8 max-w-[1400px] mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">Schedule</div>
          <h1 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight">{format(anchor, "MMMM yyyy")}</h1>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setAnchor(addDays(anchor, -7))} className="h-9 w-9 grid place-items-center rounded-lg border border-border hover:bg-secondary">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => setAnchor(addDays(anchor, 7))} className="h-9 w-9 grid place-items-center rounded-lg border border-border hover:bg-secondary">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Week strip */}
      <div className="grid grid-cols-7 gap-2 mb-7">
        {days.map((d) => {
          const isSel = isSameDay(d, selected);
          const tasksForDay = mockTasks.filter((t) => isSameDay(new Date(t.dueDate), d));
          return (
            <button
              key={d.toISOString()}
              onClick={() => setSelected(d)}
              className={cn(
                "relative p-3 rounded-xl border transition-all text-left",
                isSel
                  ? "border-primary/50 bg-gradient-card shadow-ember"
                  : "border-border bg-card hover:border-primary/30"
              )}
            >
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{format(d, "EEE")}</div>
              <div className={cn("font-display text-2xl font-semibold mt-1", isSel && "text-ember")}>{format(d, "d")}</div>
              <div className="flex gap-0.5 mt-2">
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
            <span className="text-xs text-muted-foreground">{selectedTasks.length} tasks</span>
          </div>
          {selectedTasks.length ? (
            <div className="space-y-2.5">
              {selectedTasks.map((t) => <TaskCard key={t.id} task={t} />)}
            </div>
          ) : (
            <div className="p-10 text-center rounded-xl border border-dashed border-border text-muted-foreground text-sm">
              Nothing scheduled. A clear day is a gift — or an opportunity.
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="p-5 rounded-2xl border border-border bg-gradient-card">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-1.5">Time blocks</div>
            <h3 className="font-display text-lg font-semibold mb-3">Suggested schedule</h3>
            <div className="space-y-2">
              {[
                { time: "09:00", label: "Deep work", min: 90 },
                { time: "10:45", label: "Break", min: 15 },
                { time: "11:00", label: "Strategy memo", min: 60 },
                { time: "14:00", label: "Comms batch", min: 45 },
              ].map((b) => (
                <div key={b.time} className="flex items-center gap-3 text-sm">
                  <span className="font-mono text-xs text-muted-foreground w-10">{b.time}</span>
                  <div className="flex-1 h-7 rounded-md bg-secondary border border-border px-2.5 flex items-center justify-between">
                    <span className="text-xs">{b.label}</span>
                    <span className="text-[10px] text-muted-foreground">{b.min}m</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
