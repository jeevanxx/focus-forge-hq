export async function isRequestAuthorized(
  authHeader: string | null,
  serviceRoleKey: string | undefined,
  getUserFn?: (token: string) => Promise<boolean>
): Promise<boolean> {
  if (!authHeader) return false;
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return false;
  if (serviceRoleKey && token === serviceRoleKey) return true;
  if (getUserFn) {
    return await getUserFn(token);
  }
  return false;
}
