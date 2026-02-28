import { Player, Session } from "../types/session";

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

export function addPlayer(sessionCode: string, player: Player): boolean {
  const session = sessions.get(sessionCode);
  if (!session) return false;
  session.players.push(player);
  return true;
}

export function removePlayer(sessionCode: string, playerId: string): void {
  const session = sessions.get(sessionCode);
  if (!session) return;
  session.players = session.players.filter((p) => p.playerId !== playerId);
}

// Optional: helpful for debugging/testing
export function getSessionCount(): number {
  return sessions.size;
}
