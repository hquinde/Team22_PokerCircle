import http from "http";
import { Server, Socket } from "socket.io";
import dotenv from "dotenv";
import app from "./app";

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Wrap Express in an HTTP server
const httpServer = http.createServer(app);

// Attach Socket.IO
const io = new Server(httpServer, {
  cors:
    process.env.NODE_ENV !== "production"
      ? { origin: "*", methods: ["GET", "POST"] }
      : { origin: false },
});

io.on("connection", (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
