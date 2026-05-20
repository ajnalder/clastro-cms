import { webcrypto } from "node:crypto";

const password = process.argv[2];

if (!password) {
  console.error("Usage: npm run hash:password -- '<password>'");
  process.exit(1);
}

function encodeBase64Url(value) {
  return Buffer.from(value).toString("base64url");
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

console.log(await hashPassword(password));
