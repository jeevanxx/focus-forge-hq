export async function isRequestAuthorized(
  authHeader: string | null,
  serviceRoleKey: string | undefined,
  getUserFn: (token: string) => Promise<{ data: { user: unknown | null } }>
): Promise<boolean> {
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;

  if (serviceRoleKey && token === serviceRoleKey) {
    return true;
  }

  try {
    const { data } = await getUserFn(token);
    return Boolean(data?.user);
  } catch {
    return false;
  }
}
