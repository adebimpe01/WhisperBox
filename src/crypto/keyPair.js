// src/crypto/keyPair.js

function toBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

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