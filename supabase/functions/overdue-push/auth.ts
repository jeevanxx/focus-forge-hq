export async function isRequestAuthorized(
  authHeader: string | null,
  serviceRoleKey: string | undefined,
  getUserFn?: (token: string) => Promise<{ data?: { user?: unknown } | null; error?: unknown }>
): Promise<boolean> {
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;

  if (serviceRoleKey && token === serviceRoleKey) {
    return true;
  }

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
