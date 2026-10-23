import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { addDays, format, startOfWeek } from "date-fns";
import type { Habit } from "@/lib/mock-data";

function computeStreak(logDates: Set<string>): number {
  const today = new Date();
  let streak = 0;
  let d = today;
  // Count consecutive days from today backwards
  while (logDates.has(format(d, "yyyy-MM-dd"))) {
    streak++;
    d = addDays(d, -1);
  }
  // If today not yet logged, try from yesterday
  if (streak === 0) {
    d = addDays(today, -1);
    while (logDates.has(format(d, "yyyy-MM-dd"))) {
      streak++;
      d = addDays(d, -1);
    }
  }
  return streak;
}

export function useHabits() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["habits", user?.id],
    queryFn: async () => {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 6);

      const [habitsRes, logsRes] = await Promise.all([
        supabase
          .from("habits")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("habit_logs")
          .select("habit_id, logged_date")
          .eq("user_id", user!.id)
          .gte("logged_date", format(weekStart, "yyyy-MM-dd"))
          .lte("logged_date", format(weekEnd, "yyyy-MM-dd")),
      ]);

      if (habitsRes.error) throw habitsRes.error;
      if (logsRes.error) throw logsRes.error;

      return habitsRes.data.map((h): Habit => {
        const logDates = new Set(
          logsRes.data
            .filter((l) => l.habit_id === h.id)
            .map((l) => l.logged_date)
        );
        const history = Array.from({ length: 7 }, (_, i) =>
          logDates.has(format(addDays(weekStart, i), "yyyy-MM-dd"))
        );
        return {
          id: h.id,
          name: h.name,
          emoji: h.emoji,
          streak: computeStreak(logDates),
          target: h.target,
          history,
          color: h.color as Habit["color"],
        };
      });
    },
    enabled: !!user,
    placeholderData: [] as Habit[],
  });
}

export function useLogHabit() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      habitId,
      date,
      logged,
    }: {
      habitId: string;
      date: string;
      logged: boolean;
    }) => {
      if (logged) {
        const { error } = await supabase
          .from("habit_logs")
          .insert({ habit_id: habitId, user_id: user!.id, logged_date: date });
        // Ignore duplicate (already logged today)
        if (error && error.code !== "23505") throw error;
      } else {
        const { error } = await supabase
          .from("habit_logs")
          .delete()
          .eq("habit_id", habitId)
          .eq("logged_date", date);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits", user?.id] }),
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (habit: Pick<Habit, "name" | "emoji" | "target" | "color">) => {
      const { error } = await supabase.from("habits").insert({
        user_id: user!.id,
        name: habit.name,
        emoji: habit.emoji,
        target: habit.target,
        color: habit.color,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits", user?.id] }),
  });
}
