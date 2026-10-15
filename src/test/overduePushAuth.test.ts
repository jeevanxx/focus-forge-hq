import { describe, test, expect } from "vitest";
import { isRequestAuthorized } from "../../supabase/functions/overdue-push/auth";

describe("overdue-push authorization", () => {
  test("denies request when authorization header is missing or empty", async () => {
    const getUserFn = async () => ({ data: { user: null } });

    expect(await isRequestAuthorized(null, "service-key", getUserFn)).toBe(false);
    expect(await isRequestAuthorized("", "service-key", getUserFn)).toBe(false);
    expect(await isRequestAuthorized("   ", "service-key", getUserFn)).toBe(false);
  });

  test("approves request when token matches SUPABASE_SERVICE_ROLE_KEY", async () => {
    const getUserFn = async () => ({ data: { user: null } });

    expect(
      await isRequestAuthorized("Bearer my-secret-service-key", "my-secret-service-key", getUserFn)
    ).toBe(true);

    expect(
      await isRequestAuthorized("my-secret-service-key", "my-secret-service-key", getUserFn)
    ).toBe(true);
  });

  test("approves request when user JWT is valid", async () => {
    const getUserFn = async (token: string) => {
      if (token === "valid-user-jwt") {
        return { data: { user: { id: "user-123" } } };
      }
      return { data: { user: null } };
    };

    expect(
      await isRequestAuthorized("Bearer valid-user-jwt", "service-key", getUserFn)
    ).toBe(true);
  });

  test("denies request when user JWT is invalid or error thrown", async () => {
    const getUserFn = async (token: string) => {
      if (token === "error-jwt") {
        throw new Error("JWT invalid");
      }
      return { data: { user: null } };
    };

    expect(
      await isRequestAuthorized("Bearer invalid-jwt", "service-key", getUserFn)
    ).toBe(false);

    expect(
      await isRequestAuthorized("Bearer error-jwt", "service-key", getUserFn)
    ).toBe(false);
  });
});
