// @vitest-environment node
import { describe, test, expect, vi, beforeEach } from "vitest";
import { jwtVerify, SignJWT } from "jose";

vi.mock("server-only", () => ({}));

const mockSet = vi.fn();
const mockGet = vi.fn();
const mockCookieStore = { set: mockSet, get: mockGet };
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

describe("createSession", () => {
  beforeEach(() => vi.clearAllMocks());

  test("sets an httpOnly cookie named auth-token", async () => {
    const { createSession } = await import("@/lib/auth");
    await createSession("user-123", "user@example.com");

    expect(mockSet).toHaveBeenCalledOnce();
    const [name, , options] = mockSet.mock.calls[0];
    expect(name).toBe("auth-token");
    expect(options.httpOnly).toBe(true);
  });

  test("cookie contains a valid JWT with userId and email", async () => {
    const { createSession } = await import("@/lib/auth");
    await createSession("user-123", "user@example.com");

    const token = mockSet.mock.calls[0][1];
    const { payload } = await jwtVerify(token, JWT_SECRET);

    expect(payload.userId).toBe("user-123");
    expect(payload.email).toBe("user@example.com");
  });

  test("cookie expires approximately 7 days from now", async () => {
    const { createSession } = await import("@/lib/auth");
    const before = Date.now();
    await createSession("user-123", "user@example.com");
    const after = Date.now();

    const expires: Date = mockSet.mock.calls[0][2].expires;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    expect(expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
    expect(expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
  });

  test("cookie has sameSite lax and path /", async () => {
    const { createSession } = await import("@/lib/auth");
    await createSession("user-123", "user@example.com");

    const options = mockSet.mock.calls[0][2];
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });
});

describe("getSession", () => {
  beforeEach(() => vi.clearAllMocks());

  async function makeToken(payload: object, expiresIn = "7d") {
    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(expiresIn)
      .setIssuedAt()
      .sign(JWT_SECRET);
  }

  test("returns null when no cookie is present", async () => {
    const { getSession } = await import("@/lib/auth");
    mockGet.mockReturnValue(undefined);

    const session = await getSession();
    expect(session).toBeNull();
  });

  test("returns session payload for a valid token", async () => {
    const { getSession } = await import("@/lib/auth");
    const token = await makeToken({ userId: "user-123", email: "user@example.com" });
    mockGet.mockReturnValue({ value: token });

    const session = await getSession();
    expect(session?.userId).toBe("user-123");
    expect(session?.email).toBe("user@example.com");
  });

  test("returns null for an expired token", async () => {
    const { getSession } = await import("@/lib/auth");
    // Build a token that expired 1 second ago
    const token = await new SignJWT({ userId: "user-123", email: "user@example.com" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(Math.floor(Date.now() / 1000) - 1)
      .setIssuedAt()
      .sign(JWT_SECRET);
    mockGet.mockReturnValue({ value: token });

    const session = await getSession();
    expect(session).toBeNull();
  });

  test("returns null for a tampered token", async () => {
    const { getSession } = await import("@/lib/auth");
    const token = await makeToken({ userId: "user-123", email: "user@example.com" });
    const tampered = token.slice(0, -5) + "XXXXX";
    mockGet.mockReturnValue({ value: tampered });

    const session = await getSession();
    expect(session).toBeNull();
  });

  test("returns null for a malformed token string", async () => {
    const { getSession } = await import("@/lib/auth");
    mockGet.mockReturnValue({ value: "not.a.jwt" });

    const session = await getSession();
    expect(session).toBeNull();
  });
});
