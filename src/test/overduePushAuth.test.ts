import { describe, expect, it, vi } from "vitest";
import { isRequestAuthorized } from "../../supabase/functions/overdue-push/auth";

describe("overdue-push authorization check", () => {
  const serviceRoleKey = "secret-service-role-key-12345";

  it("should deny access when Authorization header is missing or empty", async () => {
    const getUserFn = vi.fn();

    expect(
      await isRequestAuthorized({
        authHeader: null,
        serviceRoleKey,
        getUserFn,
      })
    ).toBe(false);

    expect(
      await isRequestAuthorized({
        authHeader: "",
        serviceRoleKey,
        getUserFn,
      })
    ).toBe(false);

    expect(getUserFn).not.toHaveBeenCalled();
  });

  it("should allow access when Bearer token matches service role key", async () => {
    const getUserFn = vi.fn();

    const authorized = await isRequestAuthorized({
      authHeader: `Bearer ${serviceRoleKey}`,
      serviceRoleKey,
      getUserFn,
    });

    expect(authorized).toBe(true);
    expect(getUserFn).not.toHaveBeenCalled();
  });

  it("should allow access when token corresponds to a valid authenticated user", async () => {
    const getUserFn = vi.fn().mockResolvedValue({
      data: { user: { id: "user-123", email: "user@example.com" } },
    });

    const authorized = await isRequestAuthorized({
      authHeader: "Bearer valid-user-jwt-token",
      serviceRoleKey,
      getUserFn,
    });

    expect(authorized).toBe(true);
    expect(getUserFn).toHaveBeenCalledWith("valid-user-jwt-token");
  });

  it("should deny access when user token is invalid or unauthenticated", async () => {
    const getUserFn = vi.fn().mockResolvedValue({
      data: { user: null },
    });

    const authorized = await isRequestAuthorized({
      authHeader: "Bearer invalid-user-jwt-token",
      serviceRoleKey,
      getUserFn,
    });

    expect(authorized).toBe(false);
    expect(getUserFn).toHaveBeenCalledWith("invalid-user-jwt-token");
  });

  it("should deny access when getUserFn throws an error", async () => {
    const getUserFn = vi.fn().mockRejectedValue(new Error("Auth API error"));

    const authorized = await isRequestAuthorized({
      authHeader: "Bearer errored-jwt-token",
      serviceRoleKey,
      getUserFn,
    });

    expect(authorized).toBe(false);
  });
});
