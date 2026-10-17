export async function isRequestAuthorized(
  authHeader: string | null,
  serviceRoleKey: string | undefined,
  getUserFn?: (token: string) => Promise<{ data: { user: unknown | null } }>
): Promise<boolean> {
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;

  // Check if token matches the service role key (e.g., cron or admin caller)
  if (serviceRoleKey && token === serviceRoleKey) {
    return true;
  }

  // Check if token is a valid Supabase user JWT
  if (getUserFn) {
    try {
      const { data } = await getUserFn(token);
      if (data?.user) return true;
    } catch {
      return false;
    }
  }

  return false;
}
