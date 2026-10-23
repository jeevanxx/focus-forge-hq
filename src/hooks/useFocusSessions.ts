import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { endOfWeek, format, startOfWeek } from "date-fns";
import type { FocusSession } from "@/lib/mock-data";

function dbToSession(row: any): FocusSession {
  return {
    id: row.id,
    date: row.started_at,
    durationMin: row.duration_min,
    taskTitle: row.task_title ?? undefined,
  };
}

export function useFocusSessions() {
  const { user } = useAuth();
  const now = new Date();
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["focus_sessions", user?.id, weekStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("focus_sessions")
        .select("*")
        .eq("user_id", user!.id)
        .gte("started_at", `${weekStart}T00:00:00Z`)
        .lte("started_at", `${weekEnd}T23:59:59Z`)
        .order("started_at", { ascending: true });
      if (error) throw error;
      return data.map(dbToSession);
    },
    enabled: !!user,
    placeholderData: [] as FocusSession[],
  });
}

export function useTodayFocusMinutes() {
  const { user } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");
  return useQuery({
    queryKey: ["focus_today", user?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("focus_sessions")
        .select("duration_min")
        .eq("user_id", user!.id)
        .gte("started_at", `${today}T00:00:00Z`)
        .lte("started_at", `${today}T23:59:59Z`);
      if (error) throw error;
      return data.reduce((sum, s) => sum + s.duration_min, 0);
    },
    enabled: !!user,
    placeholderData: 0,
  });
}

export function useLogFocusSession() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      durationMin,
      taskTitle,
    }: {
      durationMin: number;
      taskTitle?: string;
    }) => {
      const { error } = await supabase.from("focus_sessions").insert({
        user_id: user!.id,
        started_at: new Date().toISOString(),
        duration_min: durationMin,
        task_title: taskTitle ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      const now = new Date();
      const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const today = format(now, "yyyy-MM-dd");
      qc.invalidateQueries({ queryKey: ["focus_sessions", user?.id, weekStart] });
      qc.invalidateQueries({ queryKey: ["focus_today", user?.id, today] });
    },
  });
}
