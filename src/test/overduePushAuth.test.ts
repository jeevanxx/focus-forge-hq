import { describe, it, expect } from "vitest";

function verifyAuthorization(authHeader: string | null, serviceRoleKey: string, validTokens: Set<string>): boolean {
  const token = authHeader ? authHeader.replace("Bearer ", "").trim() : "";
  if (!token) return false;
  if (serviceRoleKey && token === serviceRoleKey) return true;
  if (validTokens.has(token)) return true;
  return false;
}

describe("overdue-push authorization check", () => {
  const SERVICE_ROLE_KEY = "test-service-role-key-12345";
  const validTokens = new Set(["valid-user-jwt-token"]);

  it("rejects missing or empty Authorization header", () => {
    expect(verifyAuthorization(null, SERVICE_ROLE_KEY, validTokens)).toBe(false);
    expect(verifyAuthorization("", SERVICE_ROLE_KEY, validTokens)).toBe(false);
  });

  it("rejects invalid or untrusted tokens", () => {
    expect(verifyAuthorization("Bearer invalid-token", SERVICE_ROLE_KEY, validTokens)).toBe(false);
  });

  it("accepts valid service role key token", () => {
    expect(verifyAuthorization(`Bearer ${SERVICE_ROLE_KEY}`, SERVICE_ROLE_KEY, validTokens)).toBe(true);
  });

  it("accepts valid user JWT token", () => {
    expect(verifyAuthorization("Bearer valid-user-jwt-token", SERVICE_ROLE_KEY, validTokens)).toBe(true);
  });
});
