import { useState } from "react";
import { mockTasks, Task } from "@/lib/mock-data";
import { TaskCard } from "@/components/TaskCard";
import { Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const filters = ["All", "Today", "High", "Done"] as const;
type Filter = typeof filters[number];

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
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

  const toggle = (id: string) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  return (
    <div className="px-5 lg:px-10 py-6 lg:py-8 max-w-[1100px] mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">Backlog</div>
          <h1 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight">Tasks</h1>
        </div>
        <button className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-xl bg-gradient-ember text-primary-foreground shadow-ember hover:opacity-95">
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New task</span>
        </button>
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
        {filtered.map((t) => <TaskCard key={t.id} task={t} onToggle={toggle} />)}
        {!filtered.length && (
          <div className="p-12 text-center rounded-xl border border-dashed border-border text-muted-foreground text-sm">
            No tasks match. Try a different filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
