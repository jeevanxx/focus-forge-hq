export interface AuthCheckParams {
  authHeader: string | null;
  serviceRoleKey: string | undefined;
  getUserFn: (token: string) => Promise<{ data: { user: unknown | null } | null }>;
}

/**
 * Validates whether an incoming HTTP request is authorized to execute the function.
 * Requests are authorized if the Authorization header token matches the SUPABASE_SERVICE_ROLE_KEY
 * or if it contains a valid user JWT token authenticated by Supabase Auth.
 */
export async function isRequestAuthorized({
  authHeader,
  serviceRoleKey,
  getUserFn,
}: AuthCheckParams): Promise<boolean> {
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;

  // 1. Service role key authorization (for scheduled or system triggers)
  if (serviceRoleKey && token === serviceRoleKey) {
    return true;
  }

  // 2. User JWT token verification
  try {
    const res = await getUserFn(token);
    return Boolean(res?.data?.user);
  } catch {
    return false;
  }
}
