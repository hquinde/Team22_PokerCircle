import { Router } from "express";
import type { Request, Response } from "express";
import asyncHandler from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/requireAuth";
import pool from "../db/pool";

const router = Router();

// POST /api/ratings
// Body: { ratedUserId: string, sessionId: string, stars: number (1–5) }
// Requires auth. Rejects duplicate rater+rated+session combos.
router.post(
  "/",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const raterId = req.session.userId!;
    const { ratedUserId, sessionId, stars } = req.body as {
      ratedUserId?: string;
      sessionId?: string;
      stars?: number;
    };

    // ── Validation ────────────────────────────────────────────────────────
    if (!ratedUserId || !sessionId || stars === undefined) {
      return res.status(400).json({
        error: "ratedUserId, sessionId, and stars are required",
      });
    }

    const starsInt = Math.round(Number(stars));
    if (!Number.isFinite(starsInt) || starsInt < 1 || starsInt > 5) {
      return res.status(400).json({ error: "stars must be an integer between 1 and 5" });
    }

    if (raterId === ratedUserId) {
      return res.status(400).json({ error: "You cannot rate yourself" });
    }

    // ── Verify the rated user exists ──────────────────────────────────────
    const userCheck = await pool.query(
      `SELECT "userID" FROM users WHERE "userID" = $1`,
      [ratedUserId]
    );
    if (userCheck.rowCount === 0) {
      return res.status(404).json({ error: "Rated user not found" });
    }

    // ── Verify the session exists and is finished ─────────────────────────
    const sessionCheck = await pool.query(
      `SELECT session_code, status FROM game_sessions WHERE session_code = $1`,
      [sessionId]
    );
    if (sessionCheck.rowCount === 0) {
      return res.status(404).json({ error: "Session not found" });
    }
    if (sessionCheck.rows[0].status !== "finished") {
      return res.status(400).json({ error: "Ratings can only be submitted for finished sessions" });
    }

    // ── Insert — ON CONFLICT catches the unique constraint violation ───────
    try {
      const result = await pool.query(
        `INSERT INTO player_ratings (rater_id, rated_id, session_id, stars)
         VALUES ($1, $2, $3, $4)
         RETURNING id, rater_id, rated_id, session_id, stars, created_at`,
        [raterId, ratedUserId, sessionId, starsInt]
      );

      const row = result.rows[0];
      return res.status(201).json({
        id: row.id,
        raterId: row.rater_id,
        ratedUserId: row.rated_id,
        sessionId: row.session_id,
        stars: row.stars,
        createdAt: row.created_at,
      });
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === "23505") {
        return res.status(409).json({
          error: "You have already rated this player for this session",
        });
      }
      throw err;
    }
  })
);

export default router;