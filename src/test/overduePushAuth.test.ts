import { describe, expect, it, vi } from "vitest";
import { isRequestAuthorized } from "../../supabase/functions/overdue-push/auth";

describe("overdue-push authorization", () => {
  const serviceKey = "secret-service-role-key";

  it("denies requests without authorization header or with empty token", async () => {
    expect(await isRequestAuthorized(null, serviceKey)).toBe(false);
    expect(await isRequestAuthorized("", serviceKey)).toBe(false);
    expect(await isRequestAuthorized("Bearer ", serviceKey)).toBe(false);
  });

  it("denies requests with invalid token when getUser fails or returns no user", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null } });
    expect(await isRequestAuthorized("Bearer invalid-token", serviceKey, mockGetUser)).toBe(false);
    expect(mockGetUser).toHaveBeenCalledWith("invalid-token");

    const mockGetUserError = vi.fn().mockRejectedValue(new Error("Invalid JWT"));
    expect(await isRequestAuthorized("Bearer bad-jwt", serviceKey, mockGetUserError)).toBe(false);
  });

  it("approves requests matching the service role key", async () => {
    const mockGetUser = vi.fn();
    expect(await isRequestAuthorized(`Bearer ${serviceKey}`, serviceKey, mockGetUser)).toBe(true);
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("approves requests with a valid user token verified by getUser", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } } });
    expect(await isRequestAuthorized("Bearer valid-user-jwt", serviceKey, mockGetUser)).toBe(true);
    expect(mockGetUser).toHaveBeenCalledWith("valid-user-jwt");
  });
});
