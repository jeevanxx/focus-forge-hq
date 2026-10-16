import { describe, it, expect, vi } from "vitest";
import { isRequestAuthorized } from "../../supabase/functions/overdue-push/auth";

describe("isRequestAuthorized", () => {
  const serviceRoleKey = "secret-service-role-key-12345";

  it("should return false when authHeader is missing or empty", async () => {
    expect(await isRequestAuthorized(null, serviceRoleKey)).toBe(false);
    expect(await isRequestAuthorized(undefined, serviceRoleKey)).toBe(false);
    expect(await isRequestAuthorized("", serviceRoleKey)).toBe(false);
    expect(await isRequestAuthorized("Bearer ", serviceRoleKey)).toBe(false);
  });

  it("should return true when authHeader matches SUPABASE_SERVICE_ROLE_KEY", async () => {
    expect(await isRequestAuthorized(`Bearer ${serviceRoleKey}`, serviceRoleKey)).toBe(true);
    expect(await isRequestAuthorized(serviceRoleKey, serviceRoleKey)).toBe(true);
  });

  it("should return true when getUserFn returns a valid user", async () => {
    const getUserFn = vi.fn().mockResolvedValue({
      data: { user: { id: "user-abc-123" } },
    });

    const result = await isRequestAuthorized("Bearer user-jwt-token", serviceRoleKey, getUserFn);
    expect(result).toBe(true);
    expect(getUserFn).toHaveBeenCalledWith("user-jwt-token");
  });

  it("should return false when getUserFn returns null/no user", async () => {
    const getUserFn = vi.fn().mockResolvedValue({
      data: { user: null },
    });

    const result = await isRequestAuthorized("Bearer invalid-jwt-token", serviceRoleKey, getUserFn);
    expect(result).toBe(false);
  });

  it("should return false when getUserFn throws an error", async () => {
    const getUserFn = vi.fn().mockRejectedValue(new Error("JWT expired"));

    const result = await isRequestAuthorized("Bearer expired-jwt-token", serviceRoleKey, getUserFn);
    expect(result).toBe(false);
  });
});
