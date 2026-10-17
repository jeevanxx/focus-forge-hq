import { describe, expect, it } from "bun:test";
import { isRequestAuthorized } from "../../supabase/functions/overdue-push/auth";

describe("isRequestAuthorized", () => {
  const serviceRoleKey = "secret-service-role-key-12345";

  it("returns false if authorization header is null, empty, or whitespace", async () => {
    expect(await isRequestAuthorized(null, serviceRoleKey)).toBe(false);
    expect(await isRequestAuthorized("", serviceRoleKey)).toBe(false);
    expect(await isRequestAuthorized("   ", serviceRoleKey)).toBe(false);
  });

  it("returns true if authorization header matches service role key directly or with Bearer prefix", async () => {
    expect(await isRequestAuthorized(serviceRoleKey, serviceRoleKey)).toBe(true);
    expect(await isRequestAuthorized(`Bearer ${serviceRoleKey}`, serviceRoleKey)).toBe(true);
    expect(await isRequestAuthorized(`bearer ${serviceRoleKey}`, serviceRoleKey)).toBe(true);
  });

  it("returns true when token validates as a user JWT via getUserFn", async () => {
    const mockGetUser = async (token: string) => {
      if (token === "valid-user-jwt") {
        return { data: { user: { id: "user-123", email: "user@example.com" } } };
      }
      return { data: { user: null } };
    };

    expect(await isRequestAuthorized("Bearer valid-user-jwt", serviceRoleKey, mockGetUser)).toBe(true);
  });

  it("returns false when token is invalid for both service role key and getUserFn", async () => {
    const mockGetUser = async (_token: string) => {
      return { data: { user: null } };
    };

    expect(await isRequestAuthorized("Bearer invalid-jwt", serviceRoleKey, mockGetUser)).toBe(false);
  });

  it("handles getUserFn throwing an error gracefully", async () => {
    const mockGetUser = async (_token: string) => {
      throw new Error("Supabase auth API error");
    };

    expect(await isRequestAuthorized("Bearer invalid-jwt", serviceRoleKey, mockGetUser)).toBe(false);
  });
});
