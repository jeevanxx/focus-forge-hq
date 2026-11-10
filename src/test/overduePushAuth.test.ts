import { describe, it, expect, vi } from "vitest";
import { isRequestAuthorized } from "../../supabase/functions/overdue-push/auth.ts";

describe("overdue-push isRequestAuthorized", () => {
  const serviceRoleKey = "secret-service-role-key-12345";

  it("should deny access when Authorization header is null or undefined", async () => {
    expect(await isRequestAuthorized(null, serviceRoleKey)).toBe(false);
    expect(await isRequestAuthorized("", serviceRoleKey)).toBe(false);
    expect(await isRequestAuthorized("   ", serviceRoleKey)).toBe(false);
  });

  it("should deny access when token does not match service role key and no user verification", async () => {
    expect(await isRequestAuthorized("Bearer invalid-token", serviceRoleKey)).toBe(false);
    expect(await isRequestAuthorized("invalid-token", serviceRoleKey)).toBe(false);
  });

  it("should allow access when Bearer token matches service role key", async () => {
    expect(await isRequestAuthorized(`Bearer ${serviceRoleKey}`, serviceRoleKey)).toBe(true);
    expect(await isRequestAuthorized(serviceRoleKey, serviceRoleKey)).toBe(true);
  });

  it("should allow access when token is validated by Supabase auth", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user-123" } },
    });

    const result = await isRequestAuthorized("Bearer valid-user-jwt", serviceRoleKey, mockGetUser);
    expect(result).toBe(true);
    expect(mockGetUser).toHaveBeenCalledWith("valid-user-jwt");
  });

  it("should deny access when user token is rejected by Supabase auth", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: null },
    });

    const result = await isRequestAuthorized("Bearer expired-token", serviceRoleKey, mockGetUser);
    expect(result).toBe(false);
  });

  it("should fail securely and deny access when getUser throws an error", async () => {
    const mockGetUser = vi.fn().mockRejectedValue(new Error("Supabase auth connection failure"));

    const result = await isRequestAuthorized("Bearer buggy-token", serviceRoleKey, mockGetUser);
    expect(result).toBe(false);
  });
});
