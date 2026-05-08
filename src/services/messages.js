const BASE = "https://whisperbox.koyeb.app";

// OFFLINE fallback (required by backend)
export async function sendMessage(token, payload) {
  const res = await fetch(`${BASE}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return res.json();
}

export async function getConversation(token, userId) {
  const res = await fetch(`${BASE}/conversations/${userId}/messages`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
}