export async function isRequestAuthorized(
  authHeader: string | null | undefined,
  serviceRoleKey: string | undefined,
  getUserFn?: (token: string) => Promise<{ data: { user: unknown } | null } | null>
): Promise<boolean> {
  if (!authHeader) return false;

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;

  // 1. Authorized if token matches the SUPABASE_SERVICE_ROLE_KEY (e.g., cron or service triggers)
  if (serviceRoleKey && token === serviceRoleKey) {
    return true;
  }

  // 2. Authorized if token represents a valid authenticated user JWT
  if (getUserFn) {
    try {
      const res = await getUserFn(token);
      if (res?.data?.user) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}
