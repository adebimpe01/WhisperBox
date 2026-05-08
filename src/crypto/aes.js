// =========================
// helpers
// =========================

function encode(text) {
  return new TextEncoder().encode(text);
}

function decode(buffer) {
  return new TextDecoder().decode(buffer);
}

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

function fromBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer; // ✅ IMPORTANT FIX
}

// =========================
// AES KEY
// =========================

export async function generateAESKey() {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// =========================
// ENCRYPT
// =========================

export async function encryptMessage(key, message) {
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encode(message)
  );

  return {
    iv: toBase64(iv),
    ciphertext: toBase64(encrypted),
  };
}

// =========================
// DECRYPT
// =========================

export async function decryptMessage(key, iv, ciphertext) {
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(fromBase64(iv)),
    },
    key,
    fromBase64(ciphertext)
  );

  return decode(decrypted);
}

// =========================
// EXPORT KEY
// =========================

export async function exportAESKey(key) {
  const raw = await crypto.subtle.exportKey("raw", key);
  return toBase64(raw);
}

// =========================
// IMPORT KEY
// =========================

export async function importAESKey(rawKey) {
  const keyBuffer =
    typeof rawKey === "string"
      ? fromBase64(rawKey)
      : rawKey;

  return crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}