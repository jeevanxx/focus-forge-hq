/**
 * Security: Validates that requests to the overdue-push trigger function
 * are authorized via the service role key or a valid authenticated user JWT.
 * Prevents unauthenticated external triggers and resource exhaustion attacks.
 */
export async function isRequestAuthorized(
  authHeader: string | null,
  serviceRoleKey: string | undefined,
  getUserFn?: (token: string) => Promise<{ data: { user: unknown } | null; error: unknown }>,
): Promise<boolean> {
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;

  // Direct service role key authorization (e.g., from cron, backend, or trusted scheduler)
  if (serviceRoleKey && token === serviceRoleKey) {
    return true;
  }

  // User session authorization (e.g., manual trigger by authenticated user)
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
