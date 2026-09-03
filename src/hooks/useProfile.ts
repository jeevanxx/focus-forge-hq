import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface Profile {
  id: string;
  displayName: string;
  focusGoalMin: number;
}

export const profileKey = (userId?: string) => ["profile", userId] as const;

export const useProfile = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = profileKey(user?.id);

  const query = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        displayName: data.display_name ?? "",
        focusGoalMin: data.focus_goal_min ?? 180,
      };
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (input: { displayName?: string; focusGoalMin?: number }) => {
      if (!user) throw new Error("Not signed in");
      const patch: { display_name?: string; focus_goal_min?: number } = {};
      if (input.displayName !== undefined) patch.display_name = input.displayName;
      if (input.focusGoalMin !== undefined) patch.focus_goal_min = input.focusGoalMin;
      const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { profile: query.data ?? null, isLoading: query.isLoading, updateProfile };
};
