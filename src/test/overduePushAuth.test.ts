import { describe, expect, it, vi } from "vitest";
import { isRequestAuthorized } from "../../supabase/functions/overdue-push/auth";

describe("overdue-push authorization helper", () => {
  it("denies requests with no Authorization header", async () => {
    const authorized = await isRequestAuthorized(null, "service-role-secret");
    expect(authorized).toBe(false);
  });

  it("denies requests with empty token", async () => {
    const authorized = await isRequestAuthorized("Bearer ", "service-role-secret");
    expect(authorized).toBe(false);
  });

  it("authorizes requests matching the service role key", async () => {
    const authorized = await isRequestAuthorized("Bearer service-role-secret", "service-role-secret");
    expect(authorized).toBe(true);
  });

  it("authorizes requests with a valid user JWT", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    const authorized = await isRequestAuthorized("Bearer valid-user-token", "service-role-secret", mockGetUser);
    expect(authorized).toBe(true);
    expect(mockGetUser).toHaveBeenCalledWith("valid-user-token");
  });

  it("denies requests with invalid user JWT", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: null,
      error: new Error("Invalid token"),
    });

    const authorized = await isRequestAuthorized("Bearer invalid-token", "service-role-secret", mockGetUser);
    expect(authorized).toBe(false);
    expect(mockGetUser).toHaveBeenCalledWith("invalid-token");
  });
});
