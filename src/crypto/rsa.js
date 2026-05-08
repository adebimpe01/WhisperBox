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
// RSA KEY PAIR
// =========================

export async function generateRSAKeys() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const publicKey = await crypto.subtle.exportKey(
    "spki",
    keyPair.publicKey
  );

  const privateKey = await crypto.subtle.exportKey(
    "pkcs8",
    keyPair.privateKey
  );

  return {
    publicKey: toBase64(publicKey),
    privateKey: toBase64(privateKey),
  };
}

// =========================
// IMPORT KEYS
// =========================

export async function importPublicKey(base64Key) {
  return crypto.subtle.importKey(
    "spki",
    fromBase64(base64Key),
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
}

export async function importPrivateKey(base64Key) {
  return crypto.subtle.importKey(
    "pkcs8",
    fromBase64(base64Key),
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );
}

// =========================
// RSA ENCRYPT / DECRYPT AES KEY
// =========================

export async function encryptAESKey(publicKey, aesKeyBuffer) {

  const buffer =
    typeof aesKeyBuffer === "string"
      ? new TextEncoder().encode(aesKeyBuffer)
      : aesKeyBuffer;

  return crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    buffer
  );
}

export async function decryptAESKey(privateKey, encryptedKey) {
  return crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedKey
  );
}