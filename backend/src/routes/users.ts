import { Router } from "express";
import type { Request, Response } from "express";
import asyncHandler from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/requireAuth";
import pool from "../db/pool";

const router = Router();

// GET /api/users/:userId/stats
// Returns aggregated all-time stats for a user from finished sessions
router.get(
  "/:userId/stats",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT
        COUNT(*)::int AS "sessionsPlayed",
        COALESCE(SUM(sp.cash_out - sp.buy_in - sp.rebuy_total), 0) AS "totalNet",
        COALESCE(MAX(sp.cash_out - sp.buy_in - sp.rebuy_total), 0) AS "biggestWin",
        COALESCE(MIN(sp.cash_out - sp.buy_in - sp.rebuy_total), 0) AS "biggestLoss"
      FROM session_players sp
      JOIN game_sessions gs ON gs.session_code = sp.session_code
      WHERE sp.user_id = $1
        AND gs.status = 'finished'`,
      [userId]
    );

    const row = result.rows[0];
    res.json({
      stats: {
        sessionsPlayed: row.sessionsPlayed,
        totalNet: parseFloat(row.totalNet),
        biggestWin: parseFloat(row.biggestWin),
        biggestLoss: parseFloat(row.biggestLoss),
      },
    });
  })
);

// GET /api/users/:userId/sessions
// Returns list of finished sessions the user participated in
router.get(
  "/:userId/sessions",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT
        gs.session_code AS "sessionCode",
        gs.created_at AS "date",
        (sp.cash_out - sp.buy_in - sp.rebuy_total) AS "net",
        (SELECT COUNT(*)::int FROM session_players WHERE session_code = gs.session_code) AS "playerCount"
      FROM session_players sp
      JOIN game_sessions gs ON gs.session_code = sp.session_code
      WHERE sp.user_id = $1
        AND gs.status = 'finished'
      ORDER BY gs.created_at DESC`,
      [userId]
    );

    res.json({
      sessions: result.rows.map((row: { sessionCode: string; date: Date | string; net: string; playerCount: number }) => ({
        sessionCode: row.sessionCode,
        date: row.date instanceof Date ? row.date.toISOString() : row.date,
        net: parseFloat(row.net),
        playerCount: row.playerCount,
      })),
    });
  })
);

export default router;
