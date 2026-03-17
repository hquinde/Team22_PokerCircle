import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/requireAuth";
import UserModel from "../models/User";

const router = Router();

// GET /api/users/search?q=<term>
router.get(
  "/search",
  asyncHandler(async (req, res) => {
    const { q } = req.query;

    if (typeof q !== "string" || q.trim().length < 3) {
      res.status(400).json({ error: "Query too short" });
      return;
    }

    const results = await UserModel.search(q.trim());
    res.status(200).json({ results });
  })
);

// POST /api/users/friend-request
router.post(
  "/friend-request",
  requireAuth,
  asyncHandler(async (req, res) => {
    const senderId = req.session.userId!;
    const { receiverId } = req.body as { receiverId?: string };

    if (!receiverId) {
      return res.status(400).json({ error: "receiverId is required" });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ error: "You cannot send a friend request to yourself" });
    }

    // Check if receiver exists
    const receiver = await UserModel.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: "Receiver not found" });
    }

    try {
      await UserModel.sendFriendRequest(senderId, receiverId);
      return res.status(201).json({ message: "Friend request sent" });
    } catch (err: any) {
      if (err?.code === "23505") {
        return res.status(409).json({ error: "Friend request already exists" });
      }
      throw err;
    }
  })
);

// GET /api/users/friend-requests/pending
router.get(
  "/friend-requests/pending",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.session.userId!;
    const requests = await UserModel.getPendingFriendRequests(userId);
    res.status(200).json({ results: requests });
  })
);

export default router;
