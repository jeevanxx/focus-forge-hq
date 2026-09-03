import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { Habit, HabitColor } from "@/lib/types";

const HISTORY_DAYS = 7;
const LOOKBACK_DAYS = 180;

const dayKey = (d: Date) => format(d, "yyyy-MM-dd");

const computeStreak = (dates: Set<string>, today: Date): number => {
  // A streak stays alive if today is done, or if today isn't done yet but yesterday was.
  let cursor = dates.has(dayKey(today)) ? today : subDays(today, 1);
  let streak = 0;
  while (dates.has(dayKey(cursor))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
};

export const habitsKey = (userId?: string) => ["habits", userId] as const;

export interface NewHabit {
  name: string;
  emoji: string;
  color: HabitColor;
  target: number;
}

export const useHabits = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = habitsKey(user?.id);

  const query = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async (): Promise<Habit[]> => {
      const since = dayKey(subDays(new Date(), LOOKBACK_DAYS));
      const [habitsRes, entriesRes] = await Promise.all([
        supabase.from("habits").select("*").eq("archived", false).order("created_at"),
        supabase.from("habit_entries").select("habit_id, entry_date").gte("entry_date", since),
      ]);
      if (habitsRes.error) throw habitsRes.error;
      if (entriesRes.error) throw entriesRes.error;

      const byHabit = new Map<string, Set<string>>();
      for (const e of entriesRes.data ?? []) {
        if (!byHabit.has(e.habit_id)) byHabit.set(e.habit_id, new Set());
        byHabit.get(e.habit_id)!.add(e.entry_date);
      }

      const today = new Date();
      const historyDays = Array.from({ length: HISTORY_DAYS }).map((_, i) =>
        dayKey(addDays(today, i - (HISTORY_DAYS - 1)))
      );

      return (habitsRes.data ?? []).map((h) => {
        const dates = byHabit.get(h.id) ?? new Set<string>();
        return {
          id: h.id,
          name: h.name,
          emoji: h.emoji,
          color: h.color as HabitColor,
          target: h.target,
          history: historyDays.map((d) => dates.has(d)),
          streak: computeStreak(dates, today),
        };
      });
    },
  });

  const createHabit = useMutation({
    mutationFn: async (input: NewHabit) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("habits").insert({
        user_id: user.id,
        name: input.name,
        emoji: input.emoji,
        color: input.color,
        target: input.target,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const toggleToday = useMutation({
    mutationFn: async (habitId: string) => {
      if (!user) throw new Error("Not signed in");
      const today = dayKey(new Date());
      const habit = (qc.getQueryData<Habit[]>(key) ?? []).find((h) => h.id === habitId);
      const doneToday = habit?.history[HISTORY_DAYS - 1] ?? false;

      if (doneToday) {
        const { error } = await supabase
          .from("habit_entries")
          .delete()
          .eq("habit_id", habitId)
          .eq("entry_date", today);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("habit_entries")
          .insert({ habit_id: habitId, user_id: user.id, entry_date: today });
        if (error && error.code !== "23505") throw error;
      }
    },
    onMutate: async (habitId: string) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Habit[]>(key);
      qc.setQueryData<Habit[]>(key, (old) =>
        (old ?? []).map((h) => {
          if (h.id !== habitId) return h;
          const history = [...h.history];
          const wasDone = history[HISTORY_DAYS - 1];
          history[HISTORY_DAYS - 1] = !wasDone;
          return { ...h, history, streak: wasDone ? Math.max(0, h.streak - 1) : h.streak + 1 };
        })
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  const updateHabit = useMutation({
    mutationFn: async ({ id, ...input }: NewHabit & { id: string }) => {
      const { error } = await supabase
        .from("habits")
        .update({ name: input.name, emoji: input.emoji, color: input.color, target: input.target })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const deleteHabit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("habits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return {
    habits: query.data ?? [],
    isLoading: query.isLoading,
    createHabit,
    updateHabit,
    toggleToday,
    deleteHabit,
  };
};
