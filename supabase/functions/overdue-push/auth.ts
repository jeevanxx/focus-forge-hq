export async function isRequestAuthorized(
  authHeader: string | null | undefined,
  serviceRoleKey: string | undefined,
  getUserFn?: (token: string) => Promise<{ data: { user: any | null } | null }>
): Promise<boolean> {
  if (!authHeader) return false;

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;

  if (serviceRoleKey && token === serviceRoleKey) {
    return true;
  }

  if (getUserFn) {
    try {
      const result = await getUserFn(token);
      if (result?.data?.user) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}
