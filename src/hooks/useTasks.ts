import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { Task, Priority } from "@/lib/types";
import type { Tables } from "@/integrations/supabase/types";

const mapTask = (row: Tables<"tasks">): Task => ({
  id: row.id,
  title: row.title,
  notes: row.notes ?? undefined,
  done: row.done,
  priority: row.priority as Priority,
  dueDate: row.due_date,
  estimateMin: row.estimate_min ?? undefined,
  tag: row.tag ?? undefined,
});

export interface NewTask {
  title: string;
  notes?: string;
  priority: Priority;
  dueDate: string;
  estimateMin?: number;
  tag?: string;
}

export const tasksKey = (userId?: string) => ["tasks", userId] as const;

export const useTasks = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = tasksKey(user?.id);

  const query = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("due_date", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapTask);
    },
  });

  const createTask = useMutation({
    mutationFn: async (input: NewTask) => {
      if (!user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: user.id,
          title: input.title,
          notes: input.notes || null,
          priority: input.priority,
          due_date: input.dueDate,
          estimate_min: input.estimateMin ?? null,
          tag: input.tag || null,
        })
        .select()
        .single();
      if (error) throw error;
      return mapTask(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const toggleTask = useMutation({
    mutationFn: async (id: string) => {
      const current = (qc.getQueryData<Task[]>(key) ?? []).find((t) => t.id === id);
      const nextDone = !current?.done;
      const { error } = await supabase
        .from("tasks")
        .update({ done: nextDone, completed_at: nextDone ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Task[]>(key);
      qc.setQueryData<Task[]>(key, (old) =>
        (old ?? []).map((t) => (t.id === id ? { ...t, done: !t.done } : t))
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...input }: NewTask & { id: string }) => {
      const { error } = await supabase
        .from("tasks")
        .update({
          title: input.title,
          notes: input.notes || null,
          priority: input.priority,
          due_date: input.dueDate,
          estimate_min: input.estimateMin ?? null,
          tag: input.tag || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return {
    tasks: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createTask,
    updateTask,
    toggleTask,
    deleteTask,
  };
};
