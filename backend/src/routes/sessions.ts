import { Router, Request, Response } from "express";
import { createSessionInDb, sessionExistsInDb, getSessionWithPlayers, addPlayerToSession } from '../store/sessionDbStore';
import { generateSessionCode } from "../utils/sessionCode";
import asyncHandler from "../middleware/asyncHandler";

const router = Router();

router.get("/", (req, res) => {
  res.json({ status: "ok", message: "sessions route reachable" });
});

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    let sessionCode = generateSessionCode(6);
    let attempts = 0;

    while (await sessionExistsInDb(sessionCode)) {
      sessionCode = generateSessionCode(6);
      attempts++;
      if (attempts > 20) {
        return res.status(500).json({ error: 'Failed to generate unique session code' });
      }
    }

    const session = await createSessionInDb(sessionCode);
    return res.status(201).json(session);
  })
);

router.get(
  '/:sessionCode',
  asyncHandler(async (req: Request, res: Response) => {
    const sessionCode = req.params['sessionCode'] as string;
    const session = await getSessionWithPlayers(sessionCode);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    return res.status(200).json(session);
  })
);

router.post(
  '/:sessionCode/join',
  asyncHandler(async (req: Request, res: Response) => {
    const sessionCode = req.params['sessionCode'] as string;

    const displayNameRaw = (req.body as { displayName?: unknown }).displayName;
    if (typeof displayNameRaw !== 'string' || displayNameRaw.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const updated = await addPlayerToSession(sessionCode, displayNameRaw);
    if (!updated) {
      return res.status(404).json({ error: 'Session not found' });
    }

    return res.status(200).json(updated);
  })
);

export default router;
