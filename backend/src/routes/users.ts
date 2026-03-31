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
  asyncHandler(async (_req: Request, _res: Response) => {
    // TODO: implement in Instance 1
  })
);

// GET /api/users/:userId/sessions
// Returns list of finished sessions the user participated in
router.get(
  "/:userId/sessions",
  requireAuth,
  asyncHandler(async (_req: Request, _res: Response) => {
    // TODO: implement in Instance 1
  })
);

export default router;
