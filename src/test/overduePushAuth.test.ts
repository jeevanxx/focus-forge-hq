import { describe, it, expect, vi } from "vitest";
import { isRequestAuthorized } from "../../supabase/functions/overdue-push/auth";

describe("overdue-push authorization check", () => {
  const serviceRoleKey = "secret-service-role-key-12345";

  it("rejects when Authorization header is missing or empty", async () => {
    expect(await isRequestAuthorized(null, serviceRoleKey)).toBe(false);
    expect(await isRequestAuthorized("", serviceRoleKey)).toBe(false);
    expect(await isRequestAuthorized("   ", serviceRoleKey)).toBe(false);
  });

  it("authorizes request with valid service role key in Bearer format or raw", async () => {
    expect(await isRequestAuthorized(`Bearer ${serviceRoleKey}`, serviceRoleKey)).toBe(true);
    expect(await isRequestAuthorized(`bearer ${serviceRoleKey}`, serviceRoleKey)).toBe(true);
    expect(await isRequestAuthorized(serviceRoleKey, serviceRoleKey)).toBe(true);
  });

  it("rejects request when service role key doesn't match and no getUserFn provided", async () => {
    expect(await isRequestAuthorized("Bearer wrong-key", serviceRoleKey)).toBe(false);
  });

  it("authorizes valid user JWT token via getUserFn", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    const result = await isRequestAuthorized("Bearer valid-user-jwt", serviceRoleKey, mockGetUser);
    expect(result).toBe(true);
    expect(mockGetUser).toHaveBeenCalledWith("valid-user-jwt");
  });

  it("rejects invalid user JWT token via getUserFn", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: null,
      error: new Error("Invalid JWT"),
    });

    const result = await isRequestAuthorized("Bearer invalid-jwt", serviceRoleKey, mockGetUser);
    expect(result).toBe(false);
  });

  it("handles getUserFn exceptions securely without leaking", async () => {
    const mockGetUser = vi.fn().mockRejectedValue(new Error("Network timeout"));

    const result = await isRequestAuthorized("Bearer faulty-jwt", serviceRoleKey, mockGetUser);
    expect(result).toBe(false);
  });
});
