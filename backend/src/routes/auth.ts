import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler";
import UserModel from "../models/User";

const router = Router();

// POST /api/auth/login
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const body = req.body as { email: unknown; password: unknown };

    if (typeof body.email !== "string" || typeof body.password !== "string") {
      res.status(400).json({ message: "email and password are required" });
      return;
    }

    const user = await UserModel.findByEmail(body.email);

    if (!user || user.password !== body.password) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((err) => (err ? reject(err) : resolve()));
    });

    req.session.userId = user.userID;
    console.log("Login successful, session userId set:", req.session.userId);

    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => (err ? reject(err) : resolve()));
    });

    res.status(200).json({
      userID: user.userID,
      username: user.username,
      email: user.email,
    });
  }),
);

// GET /api/auth/me
router.get(
  "/me",
  asyncHandler(async (req, res) => {
    console.log("GET /me, session userId:", req.session.userId);
    if (!req.session.userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const user = await UserModel.findById(req.session.userId);

    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      userID: user.userID,
      username: user.username,
      email: user.email,
    });
  }),
);

// POST /api/auth/logout
router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err) => (err ? reject(err) : resolve()));
    });

    res.clearCookie("connect.sid");
    res.status(200).json({ message: "Logged out" });
  }),
);

export default router;
