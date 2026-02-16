import { io } from "socket.io-client";

const url = process.env.SOCKET_URL || "http://localhost:3000";

const socket = io(url, {
  transports: ["websocket", "polling"],
});

socket.on("connect", () => {
  console.log("Client connected with id:", socket.id);
  // Disconnect after a moment to trigger server log
  setTimeout(() => socket.disconnect(), 500);
});

socket.on("disconnect", () => {
  console.log("Client disconnected");
  process.exit(0);
});
