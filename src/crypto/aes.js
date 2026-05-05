// src/crypto/aes.js

// convert text → buffer
function encode(text) {
  return new TextEncoder().encode(text);
}

// buffer → text
function decode(buffer) {
  return new TextDecoder().decode(buffer);
}

// buffer → base64
function toBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

// base64 → buffer
function fromBase64(base64) {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

export async function generateAESKey() {
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

// ENCRYPT MESSAGE
export async function encryptMessage(key, message) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    encode(message)
  );

  return {
    iv: toBase64(iv),
    data: toBase64(encrypted),
  };
}

// DECRYPT MESSAGE
export async function decryptMessage(key, iv, data) {
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: fromBase64(iv),
    },
    key,
    fromBase64(data)
  );

  return decode(decrypted);
}

export async function exportAESKey(key) {
  return await window.crypto.subtle.exportKey("raw", key);
}

export async function importAESKey(rawKey) {
  return await window.crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}