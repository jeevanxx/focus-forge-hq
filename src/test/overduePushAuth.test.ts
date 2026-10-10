import { describe, expect, it, vi } from "vitest";
import { isRequestAuthorized } from "../../supabase/functions/overdue-push/auth";

describe("overdue-push authorization", () => {
  it("denies requests with missing authHeader", async () => {
    const result = await isRequestAuthorized({
      authHeader: null,
      serviceRoleKey: "secret-service-role-key",
    });
    expect(result).toBe(false);
  });

  it("denies requests with empty or malformed token", async () => {
    const result = await isRequestAuthorized({
      authHeader: "Bearer   ",
      serviceRoleKey: "secret-service-role-key",
    });
    expect(result).toBe(false);
  });

  it("approves requests matching serviceRoleKey", async () => {
    const result = await isRequestAuthorized({
      authHeader: "Bearer secret-service-role-key",
      serviceRoleKey: "secret-service-role-key",
    });
    expect(result).toBe(true);
  });

  it("approves requests with valid user token from getUserFn", async () => {
    const mockGetUserFn = vi.fn().mockResolvedValue({ id: "user-123" });
    const result = await isRequestAuthorized({
      authHeader: "Bearer user-jwt-token",
      serviceRoleKey: "secret-service-role-key",
      getUserFn: mockGetUserFn,
    });
    expect(result).toBe(true);
    expect(mockGetUserFn).toHaveBeenCalledWith("user-jwt-token");
  });

  it("denies requests with invalid user token", async () => {
    const mockGetUserFn = vi.fn().mockResolvedValue(null);
    const result = await isRequestAuthorized({
      authHeader: "Bearer invalid-jwt-token",
      serviceRoleKey: "secret-service-role-key",
      getUserFn: mockGetUserFn,
    });
    expect(result).toBe(false);
  });

  it("handles exception thrown by getUserFn gracefully", async () => {
    const mockGetUserFn = vi.fn().mockRejectedValue(new Error("Auth error"));
    const result = await isRequestAuthorized({
      authHeader: "Bearer error-jwt-token",
      serviceRoleKey: "secret-service-role-key",
      getUserFn: mockGetUserFn,
    });
    expect(result).toBe(false);
  });
});
