import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { BsCheck, BsCheckAll } from "react-icons/bs";
import {
    importPrivateKey,
    importPublicKey,
    decryptAESKey,
    encryptAESKey,
} from "../crypto/rsa";

import {
    importAESKey,
    decryptMessage,
    generateAESKey,
    encryptMessage,
} from "../crypto/aes";

export default function Chat() {
    const [conversations, setConversations] = useState([]);
    const [filteredConversations, setFilteredConversations] = useState([]);
    const [activeUser, setActiveUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [search, setSearch] = useState("");
    const [onlineUsers, setOnlineUsers] = useState([]);
    const token = localStorage.getItem("token") || "";
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const keys = JSON.parse(localStorage.getItem("keys") || "{}");
    const [lastSeen, setLastSeen] = useState(null);

    const authHeader = {
        Authorization: `Bearer ${token}`,
    };

    // =========================
    // LOAD CONVERSATIONS
    // =========================
    useEffect(() => {
        if (!token) return;

        const load = async () => {
            try {
                const res = await fetch(
                    "https://whisperbox.koyeb.app/conversations",
                    { headers: authHeader }
                );

                if (res.status === 401) {
                    localStorage.clear();
                    window.location.href = "/";
                    return;
                }

                const data = await res.json();

                const list = Array.isArray(data) ? data : [];

                setConversations(list);
                setFilteredConversations(list);

            } catch (err) {
                console.error(err);
            }
        };

        load();
    }, [token]);

    const socket = io("https://whisperbox.koyeb.app", {
        auth: { token }
    });

    socket.on("online_users", setOnlineUsers);

    // =========================
    // OPEN CHAT
    // =========================
    const openChat = async (conv) => {
        if (!conv) return;

        const userId = conv.user_id || conv.id;
        if (!userId) return;

        setActiveUser(conv);
        setSearch("");

        const resLastSeen = await fetch(
            `https://whisperbox.koyeb.app/users/${userId}/last-seen`,
            { headers: authHeader }
        );

        const lastSeenData = await resLastSeen.json();
        setLastSeen(lastSeenData.lastSeen);

        try {
            const res = await fetch(
                `https://whisperbox.koyeb.app/conversations/${userId}/messages`,
                { headers: authHeader }
            );

            const data = await res.json();
            if (!Array.isArray(data)) return;

            const privateKey = await importPrivateKey(keys.privateKey);

            const decryptedMessages = await Promise.all(
                data.map(async (msg) => {
                    try {
                        const encryptedKeyBase64 =
                            String(msg.from_user_id) === String(user.id)
                                ? msg.payload.encryptedKeyForSelf
                                : msg.payload.encryptedKey;

                        const encryptedKeyBuffer = Uint8Array.from(
                            atob(encryptedKeyBase64),
                            (c) => c.charCodeAt(0)
                        ).buffer;

                        const rawAES = await decryptAESKey(
                            privateKey,
                            encryptedKeyBuffer
                        );

                        const aesKey = await importAESKey(rawAES);

                        const decryptedText = await decryptMessage(
                            aesKey,
                            msg.payload.iv,
                            msg.payload.ciphertext
                        );

                        return {
                            id: msg.id,
                            text: decryptedText,
                            from:
                                msg.from_user_id === user.id ? "me" : "them",
                        };
                    } catch {
                        return {
                            id: msg.id,
                            text: "[Unable to decrypt]",
                            from: "them",
                        };
                    }
                })
            );

            setMessages(decryptedMessages.reverse());
        } catch (err) {
            console.error(err);
        }
    };

    // =========================
    // SEND MESSAGE
    // =========================
    const sendMessage = async () => {
        if (!text || !activeUser) return;

        const userId = activeUser.user_id || activeUser.id;
        if (!userId) return;

        try {
            const keyRes = await fetch(
                `https://whisperbox.koyeb.app/users/${userId}/public-key`,
                { headers: authHeader }
            );

            const keyData = await keyRes.json();

            const recipientPublicKey = await importPublicKey(
                keyData.public_key
            );

            const myPublicKey = await importPublicKey(user.public_key);

            const aesKey = await generateAESKey();

            const encrypted = await encryptMessage(aesKey, text);

            const rawAES = await crypto.subtle.exportKey(
                "raw",
                aesKey
            );

            const encryptedKey = await encryptAESKey(
                recipientPublicKey,
                rawAES
            );

            const encryptedKeyForSelf = await encryptAESKey(
                myPublicKey,
                rawAES
            );

            const toB64 = (buffer) =>
                btoa(String.fromCharCode(...new Uint8Array(buffer)));

            const res = await fetch(
                "https://whisperbox.koyeb.app/messages",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        to: userId,
                        payload: {
                            ciphertext: encrypted.ciphertext,
                            iv: encrypted.iv,
                            encryptedKey: toB64(encryptedKey),
                            encryptedKeyForSelf: toB64(encryptedKeyForSelf),
                        },
                    }),
                }
            );

            if (!res.ok) return;

            setText("");
            openChat(activeUser);

        } catch (err) {
            console.error(err);
        }
    };

    // =========================
    // SEARCH (FIXED PROPERLY)
    // =========================
    useEffect(() => {
        const runSearch = async () => {
            try {
                if (!search.trim()) {
                    setFilteredConversations(conversations);
                    return;
                }

                const res = await fetch(
                    `https://whisperbox.koyeb.app/users/search?q=${search}`,
                    { headers: authHeader }
                );

                const data = await res.json();

                setFilteredConversations(
                    Array.isArray(data) ? data : []
                );

            } catch (err) {
                console.error(err);
            }
        };

        runSearch();
    }, [search, conversations]);

    // =========================
    // UI
    // =========================
return (
  <div className="flex h-screen bg-gray-100">

    {/* SIDEBAR */}
    <div className="w-full sm:w-[320px] border-r bg-white flex flex-col">
      
      <h3 className="p-3 font-bold text-lg border-b">Chats</h3>

      {/* SEARCH */}
      <div className="p-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full p-2 border rounded-lg outline-none"
        />
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.map((c) => (
          <div
            key={`${c.user_id || c.id}-${c.username}`}
            onClick={() => openChat(c)}
            className={`flex items-center gap-3 p-3 cursor-pointer border-b hover:bg-gray-100 ${
              activeUser?.user_id === c.user_id ? "bg-gray-200" : ""
            }`}
          >
            {/* ONLINE DOT */}
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                onlineUsers.includes(c.user_id)
                  ? "bg-green-500"
                  : "bg-gray-400"
              }`}
            />

            <div>
              <div className="font-semibold">
                {c.display_name || c.username}
              </div>
              <div className="text-xs text-gray-500">
                @{c.username}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* CHAT AREA */}
    <div className="flex-1 flex flex-col">

      {/* HEADER */}
      <div className="p-3 border-b bg-white font-semibold">
        {activeUser
          ? btoa(activeUser.username).slice(0, 20)
          : "Select a chat"}

        {lastSeen && (
          <div className="text-xs text-gray-500 font-normal">
            Last seen: {new Date(lastSeen).toLocaleString()}
          </div>
        )}
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${
              m.from === "me" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] px-3 py-2 rounded-lg relative ${
                m.from === "me"
                  ? "bg-green-200"
                  : "bg-white"
              }`}
            >
              <div className="text-sm">{m.text}</div>

              {/* TICKS */}
              {m.from === "me" && (
                <div className="text-xs text-gray-600 flex justify-end">
                  {m.seen ? (
                    <BsCheckAll className="text-blue-500" />
                  ) : (
                    <BsCheck />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* INPUT */}
      <div className="p-2 border-t bg-white flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type message..."
          className="flex-1 p-2 border rounded-lg outline-none"
        />
        <button
          onClick={sendMessage}
          className="bg-black text-white px-4 rounded-lg"
        >
          Send
        </button>
      </div>
    </div>
  </div>
);
}