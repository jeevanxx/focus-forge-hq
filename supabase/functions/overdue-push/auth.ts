export async function isRequestAuthorized(
  authHeader: string | null,
  serviceKey: string,
  getUserFn: (token: string) => Promise<boolean>,
): Promise<boolean> {
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;
  if (serviceKey && token === serviceKey) return true;
  return await getUserFn(token);
}
