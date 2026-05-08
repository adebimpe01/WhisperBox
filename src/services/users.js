const BASE = "https://whisperbox.koyeb.app";

export async function searchUsers(token, query) {
  const res = await fetch(`${BASE}/users/search?q=${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
}

export async function getUserPublicKey(token, userId) {
  const res = await fetch(`${BASE}/users/${userId}/public-key`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
}