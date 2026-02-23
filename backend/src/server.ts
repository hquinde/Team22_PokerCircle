import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import dotenv from "dotenv";
import sessionsRouter from "./routes/sessions";
import authRouter from "./routes/auth";

dotenv.config();

const app = express();

app.use(express.json());
app.use("/api/sessions", sessionsRouter);
app.use("/api/auth", authRouter);

// existing REST route(s)
app.get("/ping", (req, res) => {
  res.json({ message: "pong" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Wrap Express in an HTTP server
const httpServer = http.createServer(app);

// Attach Socket.IO
const io = new Server(httpServer, {
  // dev-friendly: allow connections during local testing
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
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
