import { describe, test, expect, vi } from "vitest";

// Helper simulating authorization validation logic from overdue-push edge function
export async function validateAuthToken(
  authHeader: string | null | undefined,
  serviceKey: string,
  getUserFn: (token: string) => Promise<{ user: { id: string } | null }>
): Promise<{ status: number; error?: string; authorized: boolean }> {
  const token = (authHeader ?? "").replace(/^Bearer\s+/i, "");
  if (!token) {
    return { status: 401, error: "Unauthorized", authorized: false };
  }

  if (token === serviceKey) {
    return { status: 200, authorized: true };
  }

  const { user } = await getUserFn(token);
  if (!user) {
    return { status: 401, error: "Unauthorized", authorized: false };
  }

  return { status: 200, authorized: true };
}

describe("overdue-push authorization validation", () => {
  const MOCK_SERVICE_ROLE_KEY = "mock-service-role-key-12345";

  test("rejects requests missing Authorization header", async () => {
    const getUserFn = vi.fn();
    const result = await validateAuthToken(null, MOCK_SERVICE_ROLE_KEY, getUserFn);

    expect(result.status).toBe(401);
    expect(result.authorized).toBe(false);
    expect(getUserFn).not.toHaveBeenCalled();
  });

  test("rejects requests with empty Bearer token", async () => {
    const getUserFn = vi.fn();
    const result = await validateAuthToken("Bearer ", MOCK_SERVICE_ROLE_KEY, getUserFn);

    expect(result.status).toBe(401);
    expect(result.authorized).toBe(false);
    expect(getUserFn).not.toHaveBeenCalled();
  });

  test("allows requests using SUPABASE_SERVICE_ROLE_KEY", async () => {
    const getUserFn = vi.fn();
    const result = await validateAuthToken(`Bearer ${MOCK_SERVICE_ROLE_KEY}`, MOCK_SERVICE_ROLE_KEY, getUserFn);

    expect(result.status).toBe(200);
    expect(result.authorized).toBe(true);
    expect(getUserFn).not.toHaveBeenCalled();
  });

  test("allows requests with valid user JWT token", async () => {
    const getUserFn = vi.fn().mockResolvedValue({ user: { id: "user-abc-123" } });
    const result = await validateAuthToken("Bearer valid-user-jwt-token", MOCK_SERVICE_ROLE_KEY, getUserFn);

    expect(result.status).toBe(200);
    expect(result.authorized).toBe(true);
    expect(getUserFn).toHaveBeenCalledWith("valid-user-jwt-token");
  });

  test("rejects requests with invalid user JWT token", async () => {
    const getUserFn = vi.fn().mockResolvedValue({ user: null });
    const result = await validateAuthToken("Bearer invalid-jwt-token", MOCK_SERVICE_ROLE_KEY, getUserFn);

    expect(result.status).toBe(401);
    expect(result.authorized).toBe(false);
    expect(getUserFn).toHaveBeenCalledWith("invalid-jwt-token");
  });
});
