import { Session } from "../types/session";

const sessions = new Map<string, Session>();

export function hasSession(sessionCode: string): boolean {
  return sessions.has(sessionCode);
}

export function createSession(session: Session): void {
  sessions.set(session.sessionCode, session);
}

export function getSession(sessionCode: string): Session | undefined {
  return sessions.get(sessionCode);
}

// Optional: helpful for debugging/testing
export function getSessionCount(): number {
  return sessions.size;
}
