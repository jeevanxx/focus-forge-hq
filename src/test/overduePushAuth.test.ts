import { describe, it, expect } from "vitest";

function validateAuthorizationHeader(
  authHeader: string | null,
  serviceRoleKey?: string,
  userValid = false
): { authorized: boolean; status: number } {
  if (!authHeader) {
    return { authorized: false, status: 401 };
  }

  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (serviceRoleKey && token === serviceRoleKey) {
    return { authorized: true, status: 200 };
  }

  if (userValid) {
    return { authorized: true, status: 200 };
  }

  return { authorized: false, status: 401 };
}

describe("overdue-push authorization validation", () => {
  const MOCK_SERVICE_ROLE_KEY = "mock-service-role-key-12345";

  it("should reject requests with missing Authorization header", () => {
    const result = validateAuthorizationHeader(null, MOCK_SERVICE_ROLE_KEY);
    expect(result.authorized).toBe(false);
    expect(result.status).toBe(401);
  });

  it("should reject requests with empty Authorization header", () => {
    const result = validateAuthorizationHeader("", MOCK_SERVICE_ROLE_KEY);
    expect(result.authorized).toBe(false);
    expect(result.status).toBe(401);
  });

  it("should authorize requests with valid Service Role Key", () => {
    const result = validateAuthorizationHeader(
      `Bearer ${MOCK_SERVICE_ROLE_KEY}`,
      MOCK_SERVICE_ROLE_KEY
    );
    expect(result.authorized).toBe(true);
    expect(result.status).toBe(200);
  });

  it("should authorize requests with valid User token", () => {
    const result = validateAuthorizationHeader(
      "Bearer valid-user-jwt",
      MOCK_SERVICE_ROLE_KEY,
      true
    );
    expect(result.authorized).toBe(true);
    expect(result.status).toBe(200);
  });

  it("should reject requests with invalid token", () => {
    const result = validateAuthorizationHeader(
      "Bearer invalid-token-xyz",
      MOCK_SERVICE_ROLE_KEY,
      false
    );
    expect(result.authorized).toBe(false);
    expect(result.status).toBe(401);
  });
});
