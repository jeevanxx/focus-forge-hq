import { describe, expect, it } from "vitest";
import { isRequestAuthorized } from "../../supabase/functions/overdue-push/auth";

describe("overdue-push isRequestAuthorized", () => {
  const serviceRoleKey = "secret-service-role-key-12345";

  it("should deny unauthenticated requests with no authorization header", async () => {
    const authorized = await isRequestAuthorized(null, serviceRoleKey);
    expect(authorized).toBe(false);
  });

  it("should deny requests with an empty authorization header or whitespace token", async () => {
    const authorized1 = await isRequestAuthorized("", serviceRoleKey);
    const authorized2 = await isRequestAuthorized("Bearer   ", serviceRoleKey);
    expect(authorized1).toBe(false);
    expect(authorized2).toBe(false);
  });

  it("should approve requests matching the service role key", async () => {
    const authorized = await isRequestAuthorized(`Bearer ${serviceRoleKey}`, serviceRoleKey);
    expect(authorized).toBe(true);
  });

  it("should approve requests with a valid user JWT token", async () => {
    const getUserFn = async (token: string) => {
      if (token === "valid-user-jwt") {
        return { data: { user: { id: "user-123" } }, error: null };
      }
      return { data: null, error: new Error("Invalid token") };
    };

    const authorized = await isRequestAuthorized("Bearer valid-user-jwt", serviceRoleKey, getUserFn);
    expect(authorized).toBe(true);
  });

  it("should deny requests with an invalid user JWT token", async () => {
    const getUserFn = async () => {
      return { data: null, error: new Error("Invalid token") };
    };

    const authorized = await isRequestAuthorized("Bearer invalid-jwt", serviceRoleKey, getUserFn);
    expect(authorized).toBe(false);
  });

  it("should handle exceptions thrown by getUserFn securely without failing", async () => {
    const getUserFn = async () => {
      throw new Error("Network / Auth provider outage");
    };

    const authorized = await isRequestAuthorized("Bearer some-jwt", serviceRoleKey, getUserFn);
    expect(authorized).toBe(false);
  });
});
