/**
 * Security helper to authenticate incoming requests to edge functions.
 * Protects against unauthenticated execution, notification spamming, and DoS.
 */
export async function isRequestAuthorized(
  authHeader: string | null,
  serviceRoleKey?: string,
  getUserFn?: (token: string) => Promise<{ data: { user: unknown } | null }>,
): Promise<boolean> {
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;

  // Allow internal service-role calls (e.g. pg_net cron jobs, webhooks)
  if (serviceRoleKey && token === serviceRoleKey) {
    return true;
  }

  // Allow authenticated users calling from the client
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
