export async function isRequestAuthorized(
  authHeader: string | null,
  serviceRoleKey: string,
  getUserFn: (token: string) => Promise<{ data: { user: unknown | null } }>
): Promise<boolean> {
  const token = (authHeader ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;

  const isServiceCall = Boolean(serviceRoleKey && (token === serviceRoleKey || (authHeader ?? "").includes(serviceRoleKey)));
  if (isServiceCall) return true;

  const { data: userData } = await getUserFn(token);
  return Boolean(userData?.user);
}
