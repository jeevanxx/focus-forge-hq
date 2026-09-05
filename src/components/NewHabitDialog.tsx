import { FormEvent, ReactNode, useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHabits } from "@/hooks/useHabits";
import { toast } from "@/hooks/use-toast";
import type { Habit, HabitColor } from "@/lib/types";

const EMOJIS = ["🔥", "💪", "📚", "🧘", "🏃", "💧", "🌙", "✍️"];

interface Props {
  trigger?: ReactNode;
  /** When provided, the dialog edits this habit instead of creating a new one. */
  habit?: Habit;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const NewHabitDialog = ({ trigger, habit, open: openProp, onOpenChange }: Props) => {
  const { createHabit, updateHabit } = useHabits();
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = onOpenChange ?? setOpenInternal;

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🔥");
  const [color, setColor] = useState<HabitColor>("ember");
  const [target, setTarget] = useState("7");

  useEffect(() => {
    if (!open) return;
    if (habit) {
      setName(habit.name);
      setEmoji(habit.emoji);
      setColor(habit.color);
      setTarget(String(habit.target));
    }
  }, [open, habit]);

  const isEdit = !!habit;
  const pending = createHabit.isPending || updateHabit.isPending;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const payload = { name: name.trim(), emoji, color, target: Number(target) || 7 };
    try {
      if (isEdit) {
        await updateHabit.mutateAsync({ id: habit.id, ...payload });
        toast({ title: "Habit updated" });
      } else {
        await createHabit.mutateAsync(payload);
        toast({ title: "Habit created", description: "Streaks start today, not tomorrow." });
      }
      setName(""); setOpen(false);
    } catch (err) {
      toast({ title: isEdit ? "Could not update habit" : "Could not create habit", description: (err as Error).message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-tight">{isEdit ? "Edit habit" : "New habit"}</DialogTitle>
          <DialogDescription>{isEdit ? "Adjust the commitment." : "One repeatable action. Track it daily."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="habit-name">Name</Label>
            <Input id="habit-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Deep work block" required autoFocus />
          </div>
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`h-10 w-10 rounded-xl border text-lg grid place-items-center transition-all ${
                    emoji === e ? "border-primary bg-primary/15 shadow-glow-primary" : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Colour</Label>
              <Select value={color} onValueChange={(v) => setColor(v as HabitColor)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ember">Primary</SelectItem>
                  <SelectItem value="amber">Amber</SelectItem>
                  <SelectItem value="violet">Violet</SelectItem>
                  <SelectItem value="teal">Teal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="habit-target">Days per week</Label>
              <Input id="habit-target" type="number" min={1} max={7} value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending} className="w-full bg-gradient-ember text-primary-foreground shadow-ember font-bold">
              {pending ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save changes" : "Create habit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
