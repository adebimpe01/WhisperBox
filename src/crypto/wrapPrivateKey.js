export async function wrapPrivateKey(aesKey, privateKeyBase64) {
  const encoder = new TextEncoder();

  const privateKeyBytes = Uint8Array.from(
    atob(privateKeyBase64),
    (c) => c.charCodeAt(0)
  );

  const wrapped = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: new Uint8Array(12) },
    aesKey,
    privateKeyBytes
  );

  return btoa(String.fromCharCode(...new Uint8Array(wrapped)));
}