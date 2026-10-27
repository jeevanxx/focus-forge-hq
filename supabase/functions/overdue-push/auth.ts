export async function isRequestAuthorized(
  req: Request,
  serviceRoleKey?: string,
  getUserFn?: (token: string) => Promise<boolean>
): Promise<boolean> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return false;

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;

  if (serviceRoleKey && token === serviceRoleKey) {
    return true;
  }

  if (getUserFn) {
    return await getUserFn(token);
  }

  return false;
}
