import { describe, it, expect, vi } from "vitest";
import { isRequestAuthorized } from "../../supabase/functions/overdue-push/auth";

describe("overdue-push authentication", () => {
  const serviceRoleKey = "secret-service-role-key";

  it("denies requests with missing or empty Authorization headers", async () => {
    expect(await isRequestAuthorized(null, serviceRoleKey)).toBe(false);
    expect(await isRequestAuthorized("", serviceRoleKey)).toBe(false);
    expect(await isRequestAuthorized("Bearer   ", serviceRoleKey)).toBe(false);
  });

  it("approves requests matching the service role key", async () => {
    expect(await isRequestAuthorized(`Bearer ${serviceRoleKey}`, serviceRoleKey)).toBe(true);
    expect(await isRequestAuthorized(serviceRoleKey, serviceRoleKey)).toBe(true);
  });

  it("validates requests with user JWT tokens via getUserFn", async () => {
    const validUserToken = "valid-user-jwt-token";
    const invalidUserToken = "invalid-user-jwt-token";

    const mockGetUser = vi.fn(async (token: string) => token === validUserToken);

    expect(await isRequestAuthorized(`Bearer ${validUserToken}`, serviceRoleKey, mockGetUser)).toBe(true);
    expect(mockGetUser).toHaveBeenCalledWith(validUserToken);

    expect(await isRequestAuthorized(`Bearer ${invalidUserToken}`, serviceRoleKey, mockGetUser)).toBe(false);
  });
});
