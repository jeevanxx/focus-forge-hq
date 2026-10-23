import { describe, it, expect, vi } from "vitest";
import { isRequestAuthorized } from "../../supabase/functions/overdue-push/auth";

describe("isRequestAuthorized", () => {
  const serviceKey = "test-service-role-key";

  it("denies requests without auth header", async () => {
    const result = await isRequestAuthorized(null, serviceKey);
    expect(result).toBe(false);
  });

  it("denies requests with empty bearer token", async () => {
    const result = await isRequestAuthorized("Bearer ", serviceKey);
    expect(result).toBe(false);
  });

  it("approves requests with matching service role key", async () => {
    const result = await isRequestAuthorized("Bearer test-service-role-key", serviceKey);
    expect(result).toBe(true);
  });

  it("approves requests with valid user token via getUserFn", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user-123", email: "user@example.com" } },
    });

    const result = await isRequestAuthorized("Bearer valid-user-jwt", serviceKey, mockGetUser);
    expect(result).toBe(true);
    expect(mockGetUser).toHaveBeenCalledWith("valid-user-jwt");
  });

  it("denies requests with invalid user token", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: null },
    });

    const result = await isRequestAuthorized("Bearer invalid-jwt", serviceKey, mockGetUser);
    expect(result).toBe(false);
    expect(mockGetUser).toHaveBeenCalledWith("invalid-jwt");
  });
});
