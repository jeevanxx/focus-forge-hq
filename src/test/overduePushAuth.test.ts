import { describe, it, expect, vi } from "vitest";
import { isRequestAuthorized } from "../../supabase/functions/overdue-push/auth";

describe("overdue-push authorization", () => {
  it("denies requests with missing or empty Authorization header", async () => {
    expect(await isRequestAuthorized(null, "service-key")).toBe(false);
    expect(await isRequestAuthorized("", "service-key")).toBe(false);
    expect(await isRequestAuthorized("Bearer ", "service-key")).toBe(false);
  });

  it("approves requests matching SUPABASE_SERVICE_ROLE_KEY", async () => {
    expect(await isRequestAuthorized("Bearer secret-service-key", "secret-service-key")).toBe(true);
  });

  it("validates user JWT token via getUserFn when token does not match service role key", async () => {
    const mockGetUser = vi.fn().mockImplementation(async (token: string) => token === "valid-user-jwt");

    expect(await isRequestAuthorized("Bearer valid-user-jwt", "service-key", mockGetUser)).toBe(true);
    expect(await isRequestAuthorized("Bearer invalid-user-jwt", "service-key", mockGetUser)).toBe(false);
    expect(mockGetUser).toHaveBeenCalledWith("valid-user-jwt");
  });
});
