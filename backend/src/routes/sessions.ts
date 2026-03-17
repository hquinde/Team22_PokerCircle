import { Router, Request, Response } from "express";
import asyncHandler from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/requireAuth";
import { generateSessionCode } from "../utils/sessionCode";
import type { Server } from "socket.io";
import type { LobbyUpdatePayload } from "../types/socketEvents";
import {
  createSessionInDb,
  getSessionWithPlayers,
  addPlayerToSession,
  updateSessionStatus,
  updatePlayerReady,
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
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const hostUserId = req.session.userId!;
    let attempts = 0;

    while (attempts < 20) {
      const sessionCode = generateSessionCode(6);

      try {
        const session = await createSessionInDb(sessionCode, hostUserId);
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

      // Socket.IO update
      const io: Server = req.app.get("io");
      const payload: LobbyUpdatePayload = {
        sessionCode,
        players: session.players,
      };
      io.to(sessionCode).emit("lobby:update", payload);

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
 * Update player ready status
 */
router.post(
  "/:sessionCode/ready",
  asyncHandler(async (req: Request, res: Response) => {
    const sessionCode = req.params.sessionCode;
    const { displayName, isReady } = req.body as { displayName?: string; isReady?: boolean };

    if (!displayName || displayName.trim().length === 0) {
      return res.status(400).json({ error: "displayName is required" });
    }
    if (typeof isReady !== "boolean") {
      return res.status(400).json({ error: "isReady must be a boolean" });
    }

    const success = await updatePlayerReady(sessionCode, displayName, isReady);
    if (!success) {
      return res.status(404).json({ error: "Player not found in session" });
    }

    const session = await getSessionWithPlayers(sessionCode);
    const io: Server = req.app.get("io");
    const payload: LobbyUpdatePayload = {
      sessionCode,
      players: session?.players ?? [],
    };
    io.to(sessionCode).emit("lobby:update", payload);

    return res.status(200).json({ sessionCode, displayName, isReady });
  })
);

/**
 * Start the game (host only)
 */
router.post(
  "/:sessionCode/start",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const sessionCode = req.params.sessionCode;
    const session = await getSessionWithPlayers(sessionCode);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (session.hostUserId !== req.session.userId) {
      return res.status(403).json({ error: "Only the host can start the game" });
    }

    // Transition to 'starting' or 'active'
    const updatedSession = await updateSessionStatus(sessionCode, "starting");
    
    const io: Server = req.app.get("io");
    io.to(sessionCode).emit("game:starting", { sessionCode });

    return res.status(200).json(updatedSession);
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
