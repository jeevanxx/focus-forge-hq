/**
 * Security: Verifies that an incoming request to overdue-push is authorized.
 * Protects against unauthenticated execution, resource exhaustion DoS,
 * and unsolicited push notifications.
 */
export async function isRequestAuthorized(
  authHeader: string | null,
  serviceRoleKey: string | undefined,
  getUserFn?: (token: string) => Promise<{ data: { user: unknown } | null; error: unknown }>
): Promise<boolean> {
  if (!authHeader) {
    return false;
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return false;
  }

  // Allow trigger via service role key (e.g., cron jobs, internal triggers)
  if (serviceRoleKey && token === serviceRoleKey) {
    return true;
  }

  // Allow trigger via authenticated user JWT token if user retrieval function provided
  if (getUserFn) {
    try {
      const { data, error } = await getUserFn(token);
      return !error && !!data?.user;
    } catch {
      return false;
    }
  }

  return false;
}
