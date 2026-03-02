import { makeDurableObject, handleWebSocket } from "@livestore/sync-cf/cf-worker";
import { betterAuth } from "better-auth";
import { D1Dialect } from "kysely-d1";

// Cloudflare Worker env bindings — extends LiveStore's required Env
interface Env {
  DB: D1Database;
  WEBSOCKET_SERVER: DurableObjectNamespace;
  ADMIN_SECRET: string;
  BETTER_AUTH_SECRET: string;
  APP_ORIGIN: string;
}

// BetterAuth instance — created per-request so it has access to env bindings
function createAuth(env: Env, request: Request) {
  // Derive baseURL from the incoming request so it works for both local dev
  // (http://localhost:8787) and production (https://websocket-server.*.workers.dev)
  const url = new URL(request.url);
  const baseURL = `${url.protocol}//${url.host}`;
  return betterAuth({
    database: {
      dialect: new D1Dialect({ database: env.DB }),
      type: "sqlite",
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL,
    trustedOrigins: [
      env.APP_ORIGIN,
      "https://marginelle.com",
      "http://localhost:60001",
      "http://localhost:5173",
    ],
    advanced: {
      crossSubDomainCookies: {
        enabled: false,
      },
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        partitioned: true,
      },
    },
    emailAndPassword: {
      enabled: true,
      password: {
        hash: async (password) => {
          const encoder = new TextEncoder();
          const passwordBuffer = encoder.encode(password);
          const saltBuffer = crypto.getRandomValues(new Uint8Array(16));
          const keyMaterial = await crypto.subtle.importKey(
            "raw",
            passwordBuffer,
            "PBKDF2",
            false,
            ["deriveBits"],
          );
          const hashBuffer = await crypto.subtle.deriveBits(
            { name: "PBKDF2", salt: saltBuffer, iterations: 100_000, hash: "SHA-256" },
            keyMaterial,
            256,
          );
          const saltHex = Array.from(saltBuffer)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          const hashHex = Array.from(new Uint8Array(hashBuffer))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          return `pbkdf2:${saltHex}:${hashHex}`;
        },
        verify: async ({ hash, password }) => {
          const parts = hash.split(":");
          if (parts.length !== 3 || parts[0] !== "pbkdf2") return false;
          const [, saltHex, storedHashHex] = parts;
          const saltBuffer = new Uint8Array(saltHex!.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
          const encoder = new TextEncoder();
          const passwordBuffer = encoder.encode(password);
          const keyMaterial = await crypto.subtle.importKey(
            "raw",
            passwordBuffer,
            "PBKDF2",
            false,
            ["deriveBits"],
          );
          const hashBuffer = await crypto.subtle.deriveBits(
            { name: "PBKDF2", salt: saltBuffer, iterations: 100_000, hash: "SHA-256" },
            keyMaterial,
            256,
          );
          const hashHex = Array.from(new Uint8Array(hashBuffer))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          return hashHex === storedHashHex;
        },
      },
    },
  });
}

// Verify a BetterAuth session token and return the user id
async function getUserIdFromToken(
  token: string,
  env: Env,
  request: Request,
): Promise<string | undefined> {
  try {
    const auth = createAuth(env, request);
    const session = await auth.api.getSession({
      headers: new Headers({ cookie: `better-auth.session_token=${token}` }),
    });
    return session?.user?.id;
  } catch {
    return undefined;
  }
}

export class WebSocketServer extends makeDurableObject({}) {}

const ALLOWED_ORIGINS = new Set([
  "http://localhost:60001",
  "http://localhost:5173",
  "https://marginelle.pages.dev",
  "https://marginelle.com",
]);

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin") ?? "";
  // Only reflect the origin back if it's explicitly allowed.
  // Returning a hardcoded fallback for unknown origins would grant them access.
  if (!ALLOWED_ORIGINS.has(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
    "Access-Control-Allow-Credentials": "true",
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight for all routes
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: getCorsHeaders(request) });
    }

    // Route /api/auth/* to BetterAuth — we apply CORS headers ourselves so they
    // are always present regardless of BetterAuth's internal origin checks
    if (url.pathname.startsWith("/api/auth")) {
      const auth = createAuth(env, request);
      const response = await auth.handler(request);
      const newHeaders = new Headers(response.headers);
      for (const [k, v] of Object.entries(getCorsHeaders(request))) {
        newHeaders.set(k, v);
      }
      return new Response(response.body, { status: response.status, headers: newHeaders });
    }

    // Route /websocket to LiveStore sync — validatePayload has env in closure
    if (url.pathname === "/websocket" || url.pathname === "/") {
      return handleWebSocket(request, env, ctx, {
        headers: getCorsHeaders(request),
        validatePayload: async (payload) => {
          const p = payload as { authToken?: string; storeId?: string } | undefined;

          if (!p?.authToken) {
            throw new Error("No auth token provided");
          }
          if (!p?.storeId) {
            throw new Error("No storeId provided");
          }

          const userId = await getUserIdFromToken(p.authToken, env, request);

          if (!userId) {
            throw new Error("Invalid or expired session token");
          }

          // Enforce that the storeId matches the authenticated user
          if (p.storeId !== userId) {
            throw new Error("storeId does not match authenticated user");
          }
        },
      });
    }

    return new Response("Not found", { status: 404, headers: getCorsHeaders(request) });
  },
} satisfies ExportedHandler<Env>;
