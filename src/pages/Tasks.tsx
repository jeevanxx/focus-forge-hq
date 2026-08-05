import { useState } from "react";
import { TaskCard } from "@/components/TaskCard";
import { NewTaskDialog } from "@/components/NewTaskDialog";
import { Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";
import { Skeleton } from "@/components/ui/skeleton";

const filters = ["All", "Today", "High", "Done"] as const;
type Filter = typeof filters[number];

const Tasks = () => {
  const { tasks, isLoading, toggleTask } = useTasks();
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const filtered = tasks.filter((t) => {
    if (query && !t.title.toLowerCase().includes(query.toLowerCase())) return false;
    if (filter === "Today") return t.dueDate === today;
    if (filter === "High") return t.priority === "high";
    if (filter === "Done") return t.done;
    return true;
  });

  return (
    <div className="px-5 lg:px-12 py-8 lg:py-12 max-w-[1200px] mx-auto animate-fade-in">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-glow-primary animate-pulse" />
            <span className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground font-bold">Backlog</span>
          </div>
          <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tight">Tasks</h1>
        </div>
        <NewTaskDialog
          trigger={
            <button className="press inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-xl bg-gradient-ember text-primary-foreground shadow-ember hover:shadow-ember-lg hover:-translate-y-0.5 transition-all">
              <Plus className="h-4 w-4" strokeWidth={2.5} /> <span className="hidden sm:inline">New task</span>
            </button>
          }
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-secondary border border-border w-fit">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                filter === f ? "bg-background text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        {!isLoading && filtered.map((t) => <TaskCard key={t.id} task={t} onToggle={(id) => toggleTask.mutate(id)} />)}
        {!isLoading && !filtered.length && (
          <div className="p-12 text-center rounded-xl border border-dashed border-border text-muted-foreground text-sm">
            {tasks.length ? "No tasks match. Try a different filter." : "No tasks yet. Add the one you've been avoiding."}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
