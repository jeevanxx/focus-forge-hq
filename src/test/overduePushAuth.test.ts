import { describe, it, expect } from "vitest";
import { isRequestAuthorized } from "../../supabase/functions/overdue-push/auth";

describe("overdue-push isRequestAuthorized", () => {
  it("denies requests without an Authorization header", async () => {
    const req = new Request("https://example.com/overdue-push");
    const result = await isRequestAuthorized(req, "secret_service_key");
    expect(result).toBe(false);
  });

  it("denies requests with empty Bearer token", async () => {
    const req = new Request("https://example.com/overdue-push", {
      headers: { Authorization: "Bearer " },
    });
    const result = await isRequestAuthorized(req, "secret_service_key");
    expect(result).toBe(false);
  });

  it("authorizes requests matching SUPABASE_SERVICE_ROLE_KEY", async () => {
    const req = new Request("https://example.com/overdue-push", {
      headers: { Authorization: "Bearer secret_service_key" },
    });
    const result = await isRequestAuthorized(req, "secret_service_key");
    expect(result).toBe(true);
  });

  it("authorizes requests with a valid user JWT token", async () => {
    const req = new Request("https://example.com/overdue-push", {
      headers: { Authorization: "Bearer valid_user_jwt" },
    });
    const getUserFn = async (token: string) => token === "valid_user_jwt";

    const result = await isRequestAuthorized(req, "secret_service_key", getUserFn);
    expect(result).toBe(true);
  });

  it("denies requests with an invalid user JWT token", async () => {
    const req = new Request("https://example.com/overdue-push", {
      headers: { Authorization: "Bearer invalid_user_jwt" },
    });
    const getUserFn = async (token: string) => token === "valid_user_jwt";

    const result = await isRequestAuthorized(req, "secret_service_key", getUserFn);
    expect(result).toBe(false);
  });
});
