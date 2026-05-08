import { io } from "socket.io-client";

let socket;

export function connectSocket(token, onMessage) {
  socket = io("wss://whisperbox.koyeb.app/ws", {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("Socket connected");
  });

  socket.on("message.receive", (data) => {
    onMessage(data);
  });

  return socket;
}

export function sendSocketMessage(payload) {
  socket.emit("message.send", payload);
}

export function disconnectSocket() {
  if (socket) socket.disconnect();
}