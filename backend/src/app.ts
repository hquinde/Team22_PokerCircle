import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

import pool from "./db/pool";
import sessionsRouter from "./routes/sessions";
import debugRouter from "./routes/debug";
import authRouter from "./routes/auth";
import { notFound, errorHandler } from "./middleware/errorMiddleware";

const app = express();
const PgStore = connectPgSimple(session);

app.use(express.json());

const sessionConfig: session.SessionOptions = {
  secret: process.env["SESSION_SECRET"] ?? "dev-secret-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "lax",
  },
};

if (process.env["NODE_ENV"] !== "test") {
  sessionConfig.store = new PgStore({ pool, tableName: "session", createTableIfMissing: false });
}

app.use(session(sessionConfig));

// routes
app.use("/api/auth", authRouter);
app.use("/api/sessions", sessionsRouter);

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

export default app;
