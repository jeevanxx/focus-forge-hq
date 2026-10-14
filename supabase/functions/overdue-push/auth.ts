/**
 * Validates whether an incoming HTTP request to overdue-push is authorized.
 * Requests are authorized if:
 * 1. The Bearer token matches the SUPABASE_SERVICE_ROLE_KEY (cron/admin triggers).
 * 2. The Bearer token is a valid user JWT verified by Supabase Auth (`getUserFn`).
 */
export async function isRequestAuthorized(
  authHeader: string | null | undefined,
  serviceRoleKey: string | null | undefined,
  getUserFn?: (token: string) => Promise<{ data: { user: unknown | null } | null; error: unknown }>
): Promise<boolean> {
  if (!authHeader) return false;

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;

  // 1. Check if token matches service role key
  if (serviceRoleKey && token === serviceRoleKey) {
    return true;
  }

  // 2. Validate user JWT if getUser function provided
  if (getUserFn) {
    try {
      const { data, error } = await getUserFn(token);
      if (!error && data?.user) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}
