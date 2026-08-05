import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { FocusSession } from "@/lib/types";

export const sessionsKey = (userId?: string) => ["focus_sessions", userId] as const;

export interface NewSession {
  durationMin: number;
  taskTitle?: string;
  taskId?: string;
  startedAt?: Date;
}

export const useFocusSessions = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = sessionsKey(user?.id);

  const query = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async (): Promise<FocusSession[]> => {
      const since = subDays(new Date(), 60).toISOString();
      const { data, error } = await supabase
        .from("focus_sessions")
        .select("*")
        .gte("started_at", since)
        .order("started_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((s) => ({
        id: s.id,
        date: s.started_at,
        durationMin: s.duration_min,
        taskTitle: s.task_title ?? undefined,
      }));
    },
  });

  const logSession = useMutation({
    mutationFn: async (input: NewSession) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("focus_sessions").insert({
        user_id: user.id,
        duration_min: input.durationMin,
        task_title: input.taskTitle || null,
        task_id: input.taskId || null,
        started_at: (input.startedAt ?? new Date()).toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return {
    sessions: query.data ?? [],
    isLoading: query.isLoading,
    logSession,
  };
};
