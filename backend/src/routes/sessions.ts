import { Router, Request, Response } from "express";
import { createSession, hasSession } from "../store/sessionStore";
import { generateSessionCode } from "../utils/sessionCode";
import { Session } from "../types/session";

const router = Router();

router.get("/", (req, res) => {
  res.json({ status: "ok", message: "sessions route reachable" });
});

router.post("/", (req: Request, res: Response) => {
  // Generate a unique 6-char code (collision handling)
  let sessionCode = generateSessionCode(6);
  let attempts = 0;

  while (hasSession(sessionCode)) {
    sessionCode = generateSessionCode(6);
    attempts++;
    if (attempts > 20) {
      // extremely unlikely, but prevents infinite loops
      return res.status(500).json({ error: "Failed to generate unique session code" });
    }
  }

  const session: Session = {
    sessionCode,
    createdAt: new Date().toISOString(),
    players: [],
  };

  createSession(session);

  return res.status(201).json(session);
});


export default router;
