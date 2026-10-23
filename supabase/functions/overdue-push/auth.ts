export async function isRequestAuthorized(
  authHeader: string | null,
  serviceRoleKey: string | undefined,
  getUserFn?: (token: string) => Promise<{ data: { user: unknown | null } | null }>
): Promise<boolean> {
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;

  if (serviceRoleKey && token === serviceRoleKey) {
    return true;
  }

  if (getUserFn) {
    const res = await getUserFn(token);
    if (res?.data?.user) {
      return true;
    }
  }

  return false;
}
