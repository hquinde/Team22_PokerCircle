import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../utils/db";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

// Signup Route
router.post("/signup", async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Username, email, and password are required" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id, username, email",
      [username, email, passwordHash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: "24h" });

    res.status(201).json({ user, token });
  } catch (err: any) {
    if (err.code === "23505") { // Unique constraint violation
      return res.status(400).json({ error: "Username or email already exists" });
    }
    console.error("Signup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login Route
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: "24h" });

    res.status(200).json({ user: { user_id: user.user_id, username: user.username, email: user.email }, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
