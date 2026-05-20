import { createHmac, timingSafeEqual } from "node:crypto";

import {
  isSiteOwnerRole,
  isSuperAdminRole as isPolicySuperAdminRole,
  normalizeCmsRole,
  type CmsRole,
} from "./role-policy";
import { getDb, getSessionSecret } from "./runtime";

const SESSION_COOKIE = "cms_session";
const HASH_ITERATIONS = 120000;

export type CmsUserRole = CmsRole;

export interface CurrentCmsUser {
  email: string;
  id: string;
  name: string;
  role: CmsUserRole;
}

interface SessionPayload {
  exp: number;
  sub: string;
}

function encodeBase64Url(value: string | Uint8Array) {
  const buffer =
    typeof value === "string" ? Buffer.from(value, "utf8") : Buffer.from(value);
  return buffer.toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url");
}

async function hmacSha256(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return encodeBase64Url(new Uint8Array(signature));
}

export function normalizeCmsUserRole(role: string | undefined | null): CmsUserRole {
  return normalizeCmsRole(role);
}

export function isSuperAdminRole(role: string | undefined | null) {
  return isPolicySuperAdminRole(role);
}

export function isAdminRole(role: string | undefined | null) {
  const normalized = normalizeCmsUserRole(role);
  return normalized === "site_owner" || normalized === "super_admin";
}

export function isOwnerRole(role: string | undefined | null) {
  return isSuperAdminRole(role) || isSiteOwnerRole(role);
}

function parsePasswordHash(value: string) {
  const [algorithm, iterations, salt, hash] = value.split("$");

  if (algorithm !== "pbkdf2-sha256" || !iterations || !salt || !hash) {
    throw new Error("Invalid password hash format.");
  }

  return {
    iterations: Number(iterations),
    salt,
    hash,
  };
}

async function pbkdf2(password: string, salt: string, iterations = HASH_ITERATIONS) {
  try {
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        hash: "SHA-256",
        salt: decodeBase64Url(salt),
        iterations,
      },
      keyMaterial,
      256,
    );

    return encodeBase64Url(new Uint8Array(bits));
  } catch {
    // Cloudflare workerd rejects PBKDF2 counts above 100000 via WebCrypto.
    const derived = pbkdf2Sha256Fallback(password, decodeBase64Url(salt), iterations, 32);
    return encodeBase64Url(derived);
  }
}

function pbkdf2Sha256Fallback(
  password: string,
  salt: Uint8Array,
  iterations: number,
  keyLength: number,
) {
  const passwordBytes = Buffer.from(password, "utf8");
  const saltBytes = Buffer.from(salt);
  const hashLength = 32;
  const blockCount = Math.ceil(keyLength / hashLength);
  const output = Buffer.alloc(blockCount * hashLength);

  for (let blockIndex = 1; blockIndex <= blockCount; blockIndex += 1) {
    const blockNumber = Buffer.allocUnsafe(4);
    blockNumber.writeUInt32BE(blockIndex, 0);

    let u = createHmac("sha256", passwordBytes)
      .update(saltBytes)
      .update(blockNumber)
      .digest();
    const block = Buffer.from(u);

    for (let iteration = 1; iteration < iterations; iteration += 1) {
      u = createHmac("sha256", passwordBytes).update(u).digest();

      for (let index = 0; index < hashLength; index += 1) {
        block[index] ^= u[index];
      }
    }

    block.copy(output, (blockIndex - 1) * hashLength);
  }

  return output.subarray(0, keyLength);
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltValue = encodeBase64Url(salt);
  const hashValue = await pbkdf2(password, saltValue, HASH_ITERATIONS);
  return `pbkdf2-sha256$${HASH_ITERATIONS}$${saltValue}$${hashValue}`;
}

export async function verifyPassword(password: string, passwordHash: string) {
  const parsed = parsePasswordHash(passwordHash);
  const candidate = await pbkdf2(password, parsed.salt, parsed.iterations);
  return timingSafeEqual(
    Buffer.from(candidate, "utf8"),
    Buffer.from(parsed.hash, "utf8"),
  );
}

export async function createSessionToken(userId: string, secret: string) {
  const payload: SessionPayload = {
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = await hmacSha256(secret, encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function createInvitationToken() {
  return encodeBase64Url(crypto.getRandomValues(new Uint8Array(24)));
}

export async function hashInvitationToken(token: string, secret: string) {
  return hmacSha256(secret, token);
}

export async function verifySessionToken(token: string, secret: string) {
  const [encodedPayload, encodedSignature] = token.split(".");

  if (!encodedPayload || !encodedSignature) {
    return null;
  }

  const expectedSignature = await hmacSha256(secret, encodedPayload);

  if (
    !timingSafeEqual(
      Buffer.from(encodedSignature, "utf8"),
      Buffer.from(expectedSignature, "utf8"),
    )
  ) {
    return null;
  }

  const payload = JSON.parse(decodeBase64Url(encodedPayload).toString("utf8")) as SessionPayload;

  if (!payload?.sub || payload.exp * 1000 < Date.now()) {
    return null;
  }

  return payload;
}

export function buildSessionCookie(token: string, request: Request) {
  const secure = new URL(request.url).protocol === "https:";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${
    secure ? "; Secure" : ""
  }`;
}

export function buildLogoutCookie(request: Request) {
  const secure = new URL(request.url).protocol === "https:";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
}

export async function getCurrentUser(
  request: Request,
  locals?: App.Locals,
): Promise<CurrentCmsUser | null> {
  if (locals?.cmsUser !== undefined) {
    return locals.cmsUser
      ? {
          email: locals.cmsUser.email,
          id: locals.cmsUser.id,
          name: locals.cmsUser.name,
          role: normalizeCmsUserRole(locals.cmsUser.role),
        }
      : null;
  }

  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(`${SESSION_COOKIE}=`.length);

  if (!token) {
    if (locals) {
      locals.cmsUser = null;
    }
    return null;
  }

  const session = await verifySessionToken(token, getSessionSecret(locals));

  if (!session) {
    if (locals) {
      locals.cmsUser = null;
    }
    return null;
  }

  const db = getDb(locals);
  if (!db) {
    if (locals) {
      locals.cmsUser = null;
    }
    return null;
  }

  const user = await db
    .prepare("SELECT id, email, name, role FROM users WHERE id = ? LIMIT 1")
    .bind(session.sub)
    .first<{ email: string; id: string; name: string; role: string }>();

  const normalizedUser: CurrentCmsUser | null = user
    ? {
        email: user.email,
        id: user.id,
        name: user.name,
        role: normalizeCmsUserRole(user.role),
      }
    : null;

  if (locals) {
    locals.cmsUser = normalizedUser;
  }

  return normalizedUser;
}
