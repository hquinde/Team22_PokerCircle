import express from "express";
import http from "http";
import { Server } from "socket.io";

import sessionsRouter from "./routes/sessions";
import debugRouter from "./routes/debug";
import { notFound, errorHandler } from "./middleware/errorMiddleware";

const app = express();

app.use(express.json());

// routes
app.use("/api/sessions", sessionsRouter);

// existing REST route(s)
app.get("/ping", (req, res) => {
  res.json({ message: "pong" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// dev-only debug
if (process.env.NODE_ENV !== "production") {
  app.use("/api/debug", debugRouter);
}

// 404 + error middleware MUST be after all routes
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Wrap Express in an HTTP server
const httpServer = http.createServer(app);

// Attach Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});