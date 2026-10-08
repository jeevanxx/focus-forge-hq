import { describe, it, expect, vi } from "vitest";
import { isRequestAuthorized } from "../lib/overduePushAuth";

describe("overduePushAuth", () => {
  const mockServiceKey = "service-role-secret-key-123";

  it("should deny requests without authorization header", async () => {
    const getUserMock = vi.fn().mockResolvedValue({ data: { user: null } });
    const authorized = await isRequestAuthorized(null, mockServiceKey, getUserMock);
    expect(authorized).toBe(false);
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("should deny requests with empty authorization header", async () => {
    const getUserMock = vi.fn().mockResolvedValue({ data: { user: null } });
    const authorized = await isRequestAuthorized("", mockServiceKey, getUserMock);
    expect(authorized).toBe(false);
  });

  it("should approve requests matching service role key", async () => {
    const getUserMock = vi.fn().mockResolvedValue({ data: { user: null } });
    const authorized = await isRequestAuthorized(`Bearer ${mockServiceKey}`, mockServiceKey, getUserMock);
    expect(authorized).toBe(true);
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("should approve requests with valid user JWT", async () => {
    const getUserMock = vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } } });
    const authorized = await isRequestAuthorized("Bearer valid-user-token", mockServiceKey, getUserMock);
    expect(authorized).toBe(true);
    expect(getUserMock).toHaveBeenCalledWith("valid-user-token");
  });

  it("should deny requests with invalid user JWT", async () => {
    const getUserMock = vi.fn().mockResolvedValue({ data: { user: null } });
    const authorized = await isRequestAuthorized("Bearer invalid-token", mockServiceKey, getUserMock);
    expect(authorized).toBe(false);
    expect(getUserMock).toHaveBeenCalledWith("invalid-token");
  });
});
