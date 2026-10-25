import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Plus, Settings } from "lucide-react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { navItems } from "./Navigation";
import { NewTaskDialog } from "./NewTaskDialog";
import { useFocus } from "@/context/FocusContext";
import { useTasks } from "@/hooks/useTasks";

/** Global Ctrl/Cmd+K palette: jump to pages, add a task, start focus on a task. */
export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [newTask, setNewTask] = useState(false);
  const navigate = useNavigate();
  const { start } = useFocus();
  const { tasks } = useTasks();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  // Performance optimization: memoize open tasks to prevent redundant task filtering
  // and array allocations on every AppShell re-render.
  const open_ = useMemo(
    () => tasks.filter((t) => !t.done).slice(0, 8),
    [tasks]
  );

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search tasks…" />
        <CommandList>
          <CommandEmpty>Nothing found.</CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => run(() => setNewTask(true))}>
              <Plus className="mr-2 h-4 w-4" /> New task
            </CommandItem>
            <CommandItem onSelect={() => run(() => { navigate("/"); start(); })}>
              <Play className="mr-2 h-4 w-4" /> Start focus session
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Go to">
            {navItems.map(({ to, label, icon: Icon }) => (
              <CommandItem key={to} onSelect={() => run(() => navigate(to))}>
                <Icon className="mr-2 h-4 w-4" /> {label}
              </CommandItem>
            ))}
            <CommandItem onSelect={() => run(() => navigate("/settings"))}>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </CommandItem>
          </CommandGroup>
          {open_.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Focus on a task">
                {open_.map((t) => (
                  <CommandItem
                    key={t.id}
                    value={`focus ${t.title}`}
                    onSelect={() => run(() => { navigate("/"); start({ taskTitle: t.title, taskId: t.id }); })}
                  >
                    <Play className="mr-2 h-4 w-4 text-primary" /> {t.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
      {newTask && <NewTaskDialog trigger={null} open={newTask} onOpenChange={setNewTask} />}
    </>
  );
};
