import { describe, it, expect, vi } from "vitest";
import { isRequestAuthorized } from "../../supabase/functions/overdue-push/auth";

describe("overduePushAuth", () => {
  const serviceKey = "service-role-secret-key-12345";

  it("should deny access when auth header is missing or empty", async () => {
    const getUserFn = vi.fn().mockResolvedValue(true);

    expect(await isRequestAuthorized(null, serviceKey, getUserFn)).toBe(false);
    expect(await isRequestAuthorized("", serviceKey, getUserFn)).toBe(false);
    expect(await isRequestAuthorized("Bearer ", serviceKey, getUserFn)).toBe(false);
    expect(getUserFn).not.toHaveBeenCalled();
  });

  it("should allow access when Bearer token matches service role key", async () => {
    const getUserFn = vi.fn().mockResolvedValue(false);

    const authorized = await isRequestAuthorized(`Bearer ${serviceKey}`, serviceKey, getUserFn);
    expect(authorized).toBe(true);
    expect(getUserFn).not.toHaveBeenCalled();
  });

  it("should allow access when user JWT token is valid via getUser", async () => {
    const getUserFn = vi.fn().mockImplementation(async (token: string) => token === "valid-user-jwt");

    expect(await isRequestAuthorized("Bearer valid-user-jwt", serviceKey, getUserFn)).toBe(true);
    expect(getUserFn).toHaveBeenCalledWith("valid-user-jwt");
  });

  it("should deny access when user JWT token is invalid", async () => {
    const getUserFn = vi.fn().mockResolvedValue(false);

    expect(await isRequestAuthorized("Bearer invalid-jwt", serviceKey, getUserFn)).toBe(false);
    expect(getUserFn).toHaveBeenCalledWith("invalid-jwt");
  });
});
