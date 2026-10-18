/**
 * Security helper to validate incoming authorization headers for overdue-push function.
 * Validates either against the SUPABASE_SERVICE_ROLE_KEY or by checking user JWT validity.
 */
export async function isRequestAuthorized(
  authHeader: string | null,
  serviceRoleKey?: string,
  getUserFn?: (token: string) => Promise<{ user: unknown } | null>
): Promise<boolean> {
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;

  // 1. Service role authorization (e.g. cron triggers)
  if (serviceRoleKey && token === serviceRoleKey) {
    return true;
  }

  // 2. User JWT token verification
  if (getUserFn) {
    try {
      const res = await getUserFn(token);
      return Boolean(res?.user);
    } catch {
      return false;
    }
  }

  return false;
}
