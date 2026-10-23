import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { Task } from "@/lib/mock-data";

function dbToTask(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes ?? undefined,
    done: row.done,
    priority: row.priority,
    dueDate: row.due_date,
    estimateMin: row.estimate_min ?? undefined,
    tag: row.tag ?? undefined,
  };
}

export function useTasks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tasks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user!.id)
        .order("due_date", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data.map(dbToTask);
    },
    enabled: !!user,
    placeholderData: [] as Task[],
  });
}

export function useToggleTask() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase.from("tasks").update({ done }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, done }) => {
      await qc.cancelQueries({ queryKey: ["tasks", user?.id] });
      const prev = qc.getQueryData<Task[]>(["tasks", user?.id]);
      qc.setQueryData<Task[]>(["tasks", user?.id], (old) =>
        old?.map((t) => (t.id === id ? { ...t, done } : t)) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(["tasks", user?.id], ctx?.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks", user?.id] });
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (task: Omit<Task, "id" | "done"> & { done?: boolean }) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: user!.id,
          title: task.title,
          notes: task.notes,
          done: task.done ?? false,
          priority: task.priority,
          due_date: task.dueDate,
          estimate_min: task.estimateMin,
          tag: task.tag,
        })
        .select()
        .single();
      if (error) throw error;
      return dbToTask(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", user?.id] }),
  });
}
