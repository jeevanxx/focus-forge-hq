import { describe, it, expect, vi } from "vitest";
import { isRequestAuthorized } from "../../supabase/functions/overdue-push/auth";

describe("overdue-push authorization", () => {
  const serviceRoleKey = "secret-service-role-key-12345";

  it("denies requests without an authorization header", async () => {
    const authorized = await isRequestAuthorized(null, serviceRoleKey);
    expect(authorized).toBe(false);
  });

  it("denies requests with empty bearer tokens", async () => {
    const authorized = await isRequestAuthorized("Bearer ", serviceRoleKey);
    expect(authorized).toBe(false);
  });

  it("allows requests matching the service role key", async () => {
    const authorized = await isRequestAuthorized(`Bearer ${serviceRoleKey}`, serviceRoleKey);
    expect(authorized).toBe(true);
  });

  it("allows requests with a valid user JWT token", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    const authorized = await isRequestAuthorized("Bearer user-jwt-token", serviceRoleKey, mockGetUser);
    expect(authorized).toBe(true);
    expect(mockGetUser).toHaveBeenCalledWith("user-jwt-token");
  });

  it("denies requests when user JWT validation fails or returns error", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: new Error("Invalid token"),
    });

    const authorized = await isRequestAuthorized("Bearer invalid-jwt-token", serviceRoleKey, mockGetUser);
    expect(authorized).toBe(false);
    expect(mockGetUser).toHaveBeenCalledWith("invalid-jwt-token");
  });
});
