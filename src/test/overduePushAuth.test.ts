import { describe, it, expect, vi } from "vitest";
import { isRequestAuthorized } from "../../supabase/functions/overdue-push/auth";

describe("isRequestAuthorized", () => {
  const serviceRoleKey = "mock-service-role-key-12345";

  it("denies requests with missing authHeader", async () => {
    const result = await isRequestAuthorized(null, serviceRoleKey);
    expect(result).toBe(false);
  });

  it("denies requests with empty or whitespace token", async () => {
    const result = await isRequestAuthorized("Bearer ", serviceRoleKey);
    expect(result).toBe(false);
  });

  it("approves requests matching serviceRoleKey", async () => {
    const result = await isRequestAuthorized(`Bearer ${serviceRoleKey}`, serviceRoleKey);
    expect(result).toBe(true);
  });

  it("approves requests with valid user JWT verified by getUserFn", async () => {
    const getUserFn = vi.fn().mockResolvedValue({ user: { id: "user-123" } });
    const result = await isRequestAuthorized("Bearer valid-user-jwt", serviceRoleKey, getUserFn);
    expect(result).toBe(true);
    expect(getUserFn).toHaveBeenCalledWith("valid-user-jwt");
  });

  it("denies requests when getUserFn returns null user", async () => {
    const getUserFn = vi.fn().mockResolvedValue(null);
    const result = await isRequestAuthorized("Bearer invalid-user-jwt", serviceRoleKey, getUserFn);
    expect(result).toBe(false);
  });

  it("denies requests when getUserFn throws an error", async () => {
    const getUserFn = vi.fn().mockRejectedValue(new Error("Auth failed"));
    const result = await isRequestAuthorized("Bearer bad-jwt", serviceRoleKey, getUserFn);
    expect(result).toBe(false);
  });
});
