import { describe, expect, it, vi } from "vitest";
import { isRequestAuthorized } from "../../supabase/functions/overdue-push/auth";

describe("overdue-push isRequestAuthorized", () => {
  const serviceRoleKey = "mock-service-role-key-12345";

  it("denies requests with missing or empty authorization header", async () => {
    expect(await isRequestAuthorized(null, serviceRoleKey)).toBe(false);
    expect(await isRequestAuthorized("", serviceRoleKey)).toBe(false);
    expect(await isRequestAuthorized("Bearer ", serviceRoleKey)).toBe(false);
  });

  it("approves requests matching the service role key", async () => {
    expect(await isRequestAuthorized(`Bearer ${serviceRoleKey}`, serviceRoleKey)).toBe(true);
    expect(await isRequestAuthorized(serviceRoleKey, serviceRoleKey)).toBe(true);
  });

  it("approves requests with valid user JWT", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
    });

    const result = await isRequestAuthorized("Bearer valid-user-jwt-token", serviceRoleKey, mockGetUser);
    expect(result).toBe(true);
    expect(mockGetUser).toHaveBeenCalledWith("valid-user-jwt-token");
  });

  it("denies requests with invalid user JWT", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: null },
    });

    const result = await isRequestAuthorized("Bearer invalid-user-jwt-token", serviceRoleKey, mockGetUser);
    expect(result).toBe(false);
  });

  it("denies requests when getUser throws an error", async () => {
    const mockGetUser = vi.fn().mockRejectedValue(new Error("JWT expired"));

    const result = await isRequestAuthorized("Bearer expired-jwt-token", serviceRoleKey, mockGetUser);
    expect(result).toBe(false);
  });
});
