import { describe, expect, it } from "vitest";
import { isRequestAuthorized } from "../../supabase/functions/overdue-push/auth";

describe("overdue-push authorization check", () => {
  const serviceRoleKey = "service-role-secret-key-12345";

  it("denies requests with no Authorization header", async () => {
    const result = await isRequestAuthorized(null, serviceRoleKey);
    expect(result).toBe(false);
  });

  it("denies requests with empty or whitespace token", async () => {
    const result = await isRequestAuthorized("Bearer   ", serviceRoleKey);
    expect(result).toBe(false);
  });

  it("approves requests matching SUPABASE_SERVICE_ROLE_KEY", async () => {
    const result = await isRequestAuthorized(`Bearer ${serviceRoleKey}`, serviceRoleKey);
    expect(result).toBe(true);
  });

  it("approves requests with valid user JWT token", async () => {
    const mockGetUser = async (token: string) => {
      if (token === "valid-user-jwt") {
        return { data: { user: { id: "user-123" } }, error: null };
      }
      return { data: null, error: new Error("Invalid token") };
    };

    const result = await isRequestAuthorized("Bearer valid-user-jwt", serviceRoleKey, mockGetUser);
    expect(result).toBe(true);
  });

  it("denies requests with invalid user JWT token", async () => {
    const mockGetUser = async (_token: string) => {
      return { data: null, error: new Error("Invalid token") };
    };

    const result = await isRequestAuthorized("Bearer invalid-jwt", serviceRoleKey, mockGetUser);
    expect(result).toBe(false);
  });
});
