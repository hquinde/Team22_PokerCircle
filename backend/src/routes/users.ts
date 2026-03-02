import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler";
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

    // Map to UserSummary: { id, displayName } as per requirements
    const userSummaries = results.map((user) => ({
      id: user.userID,
      displayName: user.username,
    }));

    res.status(200).json({ results: userSummaries });
  })
);

export default router;
