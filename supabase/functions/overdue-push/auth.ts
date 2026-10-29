export async function isRequestAuthorized(
  authHeader: string | null,
  serviceRoleKey: string | undefined,
  getUserFn?: (token: string) => Promise<boolean>
): Promise<boolean> {
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;

  // Check if token matches service role key
  if (serviceRoleKey && token === serviceRoleKey) {
    return true;
  }

  // Check if token is a valid user JWT
  if (getUserFn) {
    return await getUserFn(token);
  }

  return false;
}
