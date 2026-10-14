import { FormEvent, ReactNode, useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTasks } from "@/hooks/useTasks";
import { toast } from "@/hooks/use-toast";
import type { Priority, Subtask, Task } from "@/lib/types";
import { Plus, X } from "lucide-react";

interface Props {
  trigger: ReactNode;
  defaultDate?: Date;
  /** When provided, the dialog edits this task instead of creating a new one. */
  task?: Task;
  /** Controlled open state (used for edit mode launched from a card menu). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const NewTaskDialog = ({ trigger, defaultDate, task, open: openProp, onOpenChange }: Props) => {
  const { createTask, updateTask } = useTasks();
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = onOpenChange ?? setOpenInternal;

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<Priority>("high");
  const [dueDate, setDueDate] = useState(format(defaultDate ?? new Date(), "yyyy-MM-dd"));
  const [estimate, setEstimate] = useState("25");
  const [tag, setTag] = useState("");
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSub, setNewSub] = useState("");

  // Prefill when editing; reset when creating.
  useEffect(() => {
    if (!open) return;
    if (task) {
      setTitle(task.title);
      setNotes(task.notes ?? "");
      setPriority(task.priority);
      setDueDate(task.dueDate);
      setEstimate(task.estimateMin ? String(task.estimateMin) : "");
      setTag(task.tag ?? "");
      setSubtasks(task.subtasks ?? []);
    }
  }, [open, task]);

  const isEdit = !!task;
  const pending = createTask.isPending || updateTask.isPending;

  const addSub = () => {
    const t = newSub.trim();
    if (!t) return;
    setSubtasks([...subtasks, { id: crypto.randomUUID(), title: t, done: false }]);
    setNewSub("");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      notes: notes.trim() || undefined,
      priority,
      dueDate,
      estimateMin: estimate ? Number(estimate) : undefined,
      tag: tag.trim() || undefined,
      subtasks,
    };
    try {
      if (isEdit) {
        await updateTask.mutateAsync({ id: task.id, ...payload });
        toast({ title: "Task updated" });
      } else {
        await createTask.mutateAsync(payload);
        toast({ title: "Task added", description: "It's on the board. Now go do it." });
      }
      setTitle(""); setNotes(""); setTag(""); setSubtasks([]); setNewSub(""); setOpen(false);
    } catch (err) {
      toast({ title: isEdit ? "Could not update task" : "Could not add task", description: (err as Error).message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-tight">{isEdit ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>{isEdit ? "Refine it. Clarity wins." : "Be specific. Vague tasks never get done."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ship onboarding redesign" required autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-notes">Notes</Label>
            <Textarea id="task-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What does done look like?" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="med">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">Due date</Label>
              <Input id="task-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-est">Estimate (min)</Label>
              <Input id="task-est" type="number" min={5} step={5} value={estimate} onChange={(e) => setEstimate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-tag">Tag</Label>
              <Input id="task-tag" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Strategy" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-sub">Steps</Label>
            {subtasks.map((st) => (
              <div key={st.id} className="flex items-center gap-2 text-sm rounded-lg border border-border bg-secondary/50 px-3 py-1.5">
                <span className="flex-1 truncate">{st.title}</span>
                <button type="button" aria-label={`Remove ${st.title}`} onClick={() => setSubtasks(subtasks.filter((x) => x.id !== st.id))} className="text-muted-foreground hover:text-destructive">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                id="task-sub"
                value={newSub}
                onChange={(e) => setNewSub(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addSub(); }
                }}
                placeholder="Break it down: first step…"
              />
              <Button type="button" variant="outline" size="icon" onClick={addSub} aria-label="Add step">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending} className="w-full bg-gradient-ember text-primary-foreground shadow-ember font-bold">
              {pending ? (isEdit ? "Saving…" : "Adding…") : isEdit ? "Save changes" : "Add task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
