import { FormEvent, ReactNode, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHabits } from "@/hooks/useHabits";
import { toast } from "@/hooks/use-toast";
import type { HabitColor } from "@/lib/types";

const EMOJIS = ["🔥", "💪", "📚", "🧘", "🏃", "💧", "🌙", "✍️"];

export const NewHabitDialog = ({ trigger }: { trigger: ReactNode }) => {
  const { createHabit } = useHabits();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🔥");
  const [color, setColor] = useState<HabitColor>("ember");
  const [target, setTarget] = useState("7");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createHabit.mutateAsync({ name: name.trim(), emoji, color, target: Number(target) || 7 });
      toast({ title: "Habit created", description: "Streaks start today, not tomorrow." });
      setName(""); setOpen(false);
    } catch (err) {
      toast({ title: "Could not create habit", description: (err as Error).message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-tight">New habit</DialogTitle>
          <DialogDescription>One repeatable action. Track it daily.</DialogDescription>
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
            <Button type="submit" disabled={createHabit.isPending} className="w-full bg-gradient-ember text-primary-foreground shadow-ember font-bold">
              {createHabit.isPending ? "Creating…" : "Create habit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
