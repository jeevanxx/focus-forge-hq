import { describe, it, expect, vi } from "vitest";
import { isRequestAuthorized } from "../../supabase/functions/overdue-push/auth";

describe("overdue-push authorization check", () => {
  const serviceRoleKey = "secret-service-role-key-12345";

  it("denies requests without an Authorization header", async () => {
    expect(await isRequestAuthorized(null, serviceRoleKey)).toBe(false);
    expect(await isRequestAuthorized("", serviceRoleKey)).toBe(false);
  });

  it("denies requests with empty Bearer token", async () => {
    expect(await isRequestAuthorized("Bearer ", serviceRoleKey)).toBe(false);
    expect(await isRequestAuthorized("Bearer", serviceRoleKey)).toBe(false);
  });

  it("authorizes requests matching the service role key", async () => {
    expect(await isRequestAuthorized(`Bearer ${serviceRoleKey}`, serviceRoleKey)).toBe(true);
    expect(await isRequestAuthorized(serviceRoleKey, serviceRoleKey)).toBe(true);
  });

  it("denies requests with wrong service role key when no getUserFn is provided", async () => {
    expect(await isRequestAuthorized("Bearer wrong-key", serviceRoleKey)).toBe(false);
  });

  it("authorizes requests when getUserFn returns a valid user", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    const result = await isRequestAuthorized("Bearer valid-jwt-token", serviceRoleKey, mockGetUser);
    expect(result).toBe(true);
    expect(mockGetUser).toHaveBeenCalledWith("valid-jwt-token");
  });

  it("denies requests when getUserFn returns an error or null user", async () => {
    const mockGetUserError = vi.fn().mockResolvedValue({
      data: null,
      error: new Error("Invalid JWT"),
    });

    const result = await isRequestAuthorized("Bearer bad-jwt-token", serviceRoleKey, mockGetUserError);
    expect(result).toBe(false);

    const mockGetUserNoUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result2 = await isRequestAuthorized("Bearer bad-jwt-token-2", serviceRoleKey, mockGetUserNoUser);
    expect(result2).toBe(false);
  });

  it("handles exceptions thrown by getUserFn gracefully", async () => {
    const mockGetUserThrows = vi.fn().mockRejectedValue(new Error("Network or auth error"));
    const result = await isRequestAuthorized("Bearer bad-jwt", serviceRoleKey, mockGetUserThrows);
    expect(result).toBe(false);
  });
});
