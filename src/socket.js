import { io } from "socket.io-client";

let socket = null;

export const getSocket = () => socket;

export const connectSocket = () => {
  socket = io("http://localhost:5000", {
    auth: {
      token: localStorage.getItem("token"),
    },
  });

  return socket;
};



           