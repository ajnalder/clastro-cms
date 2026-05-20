import { webcrypto } from "node:crypto";

const email = (process.env.CMS_ADMIN_EMAIL || process.argv[2] || "").trim().toLowerCase();
const password = process.env.CMS_ADMIN_PASSWORD || process.argv[3] || "";
const name = process.env.CMS_ADMIN_NAME || process.argv[4] || "Clastro Super Admin";
const role = process.env.CMS_ADMIN_ROLE || "super_admin";

if (!email || !password) {
  console.error("Usage: CMS_ADMIN_EMAIL=you@example.com CMS_ADMIN_PASSWORD='long-password' node scripts/create-admin-user-sql.mjs");
  process.exit(1);
}

function encodeBase64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function sql(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function hashPassword(value) {
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await webcrypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(value),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await webcrypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: 120000,
    },
    keyMaterial,
    256,
  );

  return `pbkdf2-sha256$120000$${encodeBase64Url(salt)}$${encodeBase64Url(new Uint8Array(bits))}`;
}

const passwordHash = await hashPassword(password);

console.log(`INSERT INTO users (id, email, name, role, password_hash, updated_at)
VALUES ('clastro-super-admin', ${sql(email)}, ${sql(name)}, ${sql(role)}, ${sql(passwordHash)}, CURRENT_TIMESTAMP)
ON CONFLICT(email) DO UPDATE SET
  name = excluded.name,
  role = excluded.role,
  password_hash = excluded.password_hash,
  updated_at = CURRENT_TIMESTAMP;`);
