// src/crypto/pbkdf2.js

export async function deriveKeyFromPassword(password, saltBase64) {
  const enc = new TextEncoder();

  const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));

  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}