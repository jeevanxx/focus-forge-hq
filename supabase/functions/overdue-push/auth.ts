export interface AuthOptions {
  authHeader?: string | null;
  serviceRoleKey?: string;
  getUserFn?: (token: string) => Promise<{ id?: string } | null>;
}

/**
 * Validates whether an incoming request is authorized via service role key or user JWT token.
 * Prevents unauthorized trigger execution and resource exhaustion DoS.
 */
export async function isRequestAuthorized(options: AuthOptions): Promise<boolean> {
  const { authHeader, serviceRoleKey, getUserFn } = options;
  if (!authHeader) return false;

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;

  // Check 1: Match against SUPABASE_SERVICE_ROLE_KEY
  if (serviceRoleKey && token === serviceRoleKey) {
    return true;
  }

  // Check 2: Validate JWT user session
  if (getUserFn) {
    try {
      const user = await getUserFn(token);
      if (user) return true;
    } catch {
      return false;
    }
  }

  return false;
}
