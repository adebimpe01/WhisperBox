import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Lock, ArrowLeft } from "lucide-react";

import {
  generateAESKey,
  encryptMessage,
  decryptMessage,
  exportAESKey,
  importAESKey,
} from "./crypto/aes";

import {
  generateRSAKeys,
  importPublicKey,
  importPrivateKey,
  encryptAESKey,
  decryptAESKey,
} from "./crypto/rsa";

let socket;

export default function App() {
  // ================= STATE =================
  const [authState, setAuthState] = useState("loading");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [users, setUsers] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState({});

  const [myPrivateKey, setMyPrivateKey] = useState("");
  const [myPublicKey, setMyPublicKey] = useState("");

  // ================= INIT KEYS =================
  useEffect(() => {
    const init = async () => {
      const existing = localStorage.getItem("keys");

      if (existing) {
        const parsed = JSON.parse(existing);
        setMyPrivateKey(parsed.privateKey);
        setMyPublicKey(parsed.publicKey);
        return;
      }

      const keys = await generateRSAKeys();

      localStorage.setItem(
        "keys",
        JSON.stringify({
          privateKey: keys.privateKey,
          publicKey: keys.publicKey,
        })
      );

      setMyPrivateKey(keys.privateKey);
      setMyPublicKey(keys.publicKey);
    };

    init();
  }, []);

  // ================= AUTH CHECK =================
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setAuthState("loggedOut");
      return;
    }

    fetch("http://localhost:5000/users", {
      headers: { Authorization: token },
    })
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setAuthState("loggedIn");
      })
      .catch(() => {
        localStorage.removeItem("token");
        setAuthState("loggedOut");
      });
  }, []);

  // ================= SOCKET =================
  useEffect(() => {
    if (authState !== "loggedIn") return;

    socket = io("http://localhost:5000", {
      auth: { token: localStorage.getItem("token") },
    });

    socket.on("receive_message", handleReceive);

    return () => socket.disconnect();
  }, [authState]);

  // ================= AUTH =================
  const register = async () => {
    const res = await fetch("http://localhost:5000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, publicKey: myPublicKey }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.message);

    alert("Registered");
  };

  const login = async () => {
    const res = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.message);

    localStorage.setItem("token", data.token);

    const usersRes = await fetch("http://localhost:5000/users", {
      headers: { Authorization: data.token },
    });

    const usersData = await usersRes.json();

    setUsers(usersData);
    setAuthState("loggedIn");

    setUsername("");
    setPassword("");
  };

  const logout = () => {
    localStorage.removeItem("token");
    setAuthState("loggedOut");
    setActiveContact(null);
    setUsers([]);
  };

  // ================= RECEIVE =================
  const handleReceive = async (data) => {
    try {
      const privateKey = await importPrivateKey(myPrivateKey);

      const encryptedKeyBuffer = Uint8Array.from(
        atob(data.encryptedKey),
        (c) => c.charCodeAt(0)
      );

      const rawKey = await decryptAESKey(privateKey, encryptedKeyBuffer);
      const aesKey = await importAESKey(rawKey);

      const decrypted = await decryptMessage(
        aesKey,
        data.iv,
        data.ciphertext
      );

      const sender = users.find(u => u.publicKey === data.senderPublicKey);
      if (!sender) return;

      setChats(prev => ({
        ...prev,
        [sender.id]: [
          ...(prev[sender.id] || []),
          { text: decrypted, type: "received" },
        ],
      }));
    } catch (err) {
      console.error(err);
    }
  };

  // ================= SEND =================
  const sendMessage = async () => {
    if (!message || !activeContact) return;

    const receiverKey = await importPublicKey(activeContact.publicKey);

    const aesKey = await generateAESKey();
    const encrypted = await encryptMessage(aesKey, message);

    const rawKey = await exportAESKey(aesKey);
    const encryptedAESKey = await encryptAESKey(receiverKey, rawKey);

    const encryptedKey = btoa(
      String.fromCharCode(...new Uint8Array(encryptedAESKey))
    );

    socket.emit("send_message", {
      receiverId: activeContact.id,
      iv: encrypted.iv,
      ciphertext: encrypted.data,
      encryptedKey,
      senderPublicKey: myPublicKey,
    });

    setChats(prev => ({
      ...prev,
      [activeContact.id]: [
        ...(prev[activeContact.id] || []),
        { text: message, type: "sent" },
      ],
    }));

    setMessage("");
  };

  // ================= LOADING =================
  if (authState === "loading") {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // ================= LOGIN =================
  if (authState === "loggedOut") {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-6 rounded w-full max-w-sm space-y-3 shadow">
          <h2 className="text-center font-bold"> WhisperBox</h2>

          <input
            className="w-full p-2 border rounded"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="off"
          />

          <input
            className="w-full p-2 border rounded"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />

          <button onClick={register} className="w-full bg-green-500 text-white p-2 rounded">
            Register
          </button>

          <button onClick={login} className="w-full bg-blue-500 text-white p-2 rounded">
            Login
          </button>
        </div>
      </div>
    );
  }

  // ================= MAIN UI =================
  return (
    <div className="h-screen flex flex-col bg-gray-100">

      {/* TOP BAR */}
      <div className="p-3 bg-white border-b flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold">
          <Lock size={18} />
          WhisperBox
        </div>

        <button
          onClick={logout}
          className="bg-red-500 text-white px-3 py-1 rounded text-sm"
        >
          Logout
        </button>
      </div>

      {/* MAIN WRAPPER */}
      <div className="flex flex-1 overflow-hidden">

        {/* SIDEBAR */}
        <div
          className={`
          bg-white border-r
          w-full sm:w-1/3
          ${activeContact ? "hidden sm:flex" : "flex"}
          flex-col
        `}
        >
          <div className="p-3 font-bold border-b">Users</div>

          <div className="flex-1 overflow-y-auto">
            {users.map((u) => (
              <div
                key={u.id}
                onClick={() => setActiveContact(u)}
                className={`
                p-3 cursor-pointer hover:bg-gray-100
                ${activeContact?.id === u.id ? "bg-gray-200" : ""}
              `}
              >
                {u.username}
              </div>
            ))}
          </div>
        </div>

        {/* CHAT AREA */}
        <div
          className={`
          flex-1 flex flex-col
          ${!activeContact ? "hidden sm:flex" : "flex"}
        `}
        >

          {/* CHAT HEADER */}
          <div className="p-3 bg-white border-b flex items-center gap-2">
            <button
              className="sm:hidden p-1 bg-gray-200 rounded"
              onClick={() => setActiveContact(null)}
            >
              <ArrowLeft size={16} />
            </button>

            <span className="font-semibold">
              {activeContact?.username || "Select a user"}
            </span>
          </div>

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {(chats[activeContact?.id] || []).map((m, i) => (
              <div
                key={i}
                className={`
                max-w-[75%] p-2 rounded
                ${m.type === "sent"
                    ? "ml-auto bg-green-200"
                    : "bg-white"
                  }
              `}
              >
                {m.text}
              </div>
            ))}
          </div>

          {/* INPUT */}
          <div className="p-3 bg-white border-t flex gap-2">
            <input
              className="flex-1 border p-2 rounded text-sm"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type message..."
              disabled={!activeContact}
            />

            <button
              onClick={sendMessage}
              className="bg-green-500 text-white px-4 rounded"
            >
              Send
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}