import { Router, Request, Response } from "express";
import asyncHandler from "../middleware/asyncHandler";
import { generateSessionCode } from "../utils/sessionCode";
import {
  createSessionInDb,
  getSessionWithPlayers,
  addPlayerToSession,
  updateSessionStatus,
} from "../store/sessionDbStore";

const router = Router();

router.get("/", (req, res) => {
  res.json({ status: "ok", message: "sessions route reachable" });
});

/**
 * Create a new game session
 */
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    let attempts = 0;

    while (attempts < 20) {
      const sessionCode = generateSessionCode(6);

      try {
        const session = await createSessionInDb(sessionCode);
        return res.status(201).json(session);
      } catch (err: any) {
        // Unique constraint violation for session_code
        if (err?.code === "23505") {
          attempts++;
          continue;
        }
        throw err;
      }
    }

    return res.status(500).json({ error: "Failed to generate unique session code" });
  })
);

/**
 * Get session state by code
 */
router.get(
  "/:sessionCode",
  asyncHandler(async (req: Request, res: Response) => {
    const sessionCode = req.params.sessionCode;
    const session = await getSessionWithPlayers(sessionCode);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    return res.status(200).json(session);
  })
);

/**
 * Join a session
 */
router.post(
  "/:sessionCode/join",
  asyncHandler(async (req: Request, res: Response) => {
    const sessionCode = req.params.sessionCode;
    const { displayName } = req.body as { displayName?: string };

    if (!displayName || displayName.trim().length === 0) {
      return res.status(400).json({ error: "displayName is required" });
    }

    try {
      const session = await addPlayerToSession(sessionCode, displayName);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      return res.status(200).json(session);
    } catch (err: any) {
      if (err?.code === "23505") {
        return res.status(409).json({ error: "Player name already exists in this session" });
      }
      throw err;
    }
  })
);

/**
 * Update session status (e.g., transition from lobby to starting)
 */
router.patch(
  "/:sessionCode/status",
  asyncHandler(async (req: Request, res: Response) => {
    const sessionCode = req.params.sessionCode;
    const { status } = req.body as { status?: string };

    const validStatuses = ["lobby", "starting", "active", "finished"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const session = await updateSessionStatus(sessionCode, status);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    return res.status(200).json(session);
  })
);

export default router;
