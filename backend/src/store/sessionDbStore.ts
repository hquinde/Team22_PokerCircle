import pool from '../db/pool';
import { Session, Player } from '../types/session';

function normalizeSessionCode(sessionCode: string): string {
  return sessionCode.trim().toUpperCase();
}

export async function getSessionWithPlayers(sessionCode: string): Promise<Session | null> {
  const code = normalizeSessionCode(sessionCode);

  const sessionRes = await pool.query(
    'SELECT id, session_code, status, game_state, created_at FROM game_sessions WHERE session_code = $1',
    [code]
  );

  if (sessionRes.rowCount === 0) return null;

  const playersRes = await pool.query(
    `SELECT id, display_name, joined_at
     FROM players
     WHERE session_id = $1
     ORDER BY joined_at ASC`,
    [sessionRes.rows[0].id]
  );

  return {
    sessionId: sessionRes.rows[0].id,
    sessionCode: sessionRes.rows[0].session_code,
    status: sessionRes.rows[0].status,
    gameState: sessionRes.rows[0].game_state,
    createdAt: sessionRes.rows[0].created_at,
    players: playersRes.rows.map((r) => ({
      playerId: r.id,
      displayName: r.display_name,
      joinedAt: r.joined_at,
    })),
  };
}

export async function addPlayerToSession(
  sessionCode: string,
  displayName: string
): Promise<Session | null> {
  const code = normalizeSessionCode(sessionCode);
  const name = displayName.trim();

  const session = await getSessionWithPlayers(code);
  if (!session) return null;

  await pool.query(
    'INSERT INTO players (session_id, display_name) VALUES ($1, $2)',
    [session.sessionId, name]
  );

  return getSessionWithPlayers(code);
}

export async function createSessionInDb(sessionCode: string): Promise<Session> {
  const code = normalizeSessionCode(sessionCode);

  const insertRes = await pool.query(
    'INSERT INTO game_sessions (session_code) VALUES ($1) RETURNING id, session_code, status, game_state, created_at',
    [code]
  );

  const row = insertRes.rows[0];
  return {
    sessionId: row.id,
    sessionCode: row.session_code,
    status: row.status,
    gameState: row.game_state,
    createdAt: row.created_at,
    players: [],
  };
}

export async function updateSessionStatus(
  sessionCode: string,
  status: string
): Promise<Session | null> {
  const code = normalizeSessionCode(sessionCode);

  const updateRes = await pool.query(
    'UPDATE game_sessions SET status = $1 WHERE session_code = $2 RETURNING id',
    [status, code]
  );

  if (updateRes.rowCount === 0) return null;

  return getSessionWithPlayers(code);
}

export async function sessionExistsInDb(sessionCode: string): Promise<boolean> {
  const code = normalizeSessionCode(sessionCode);
  const res = await pool.query('SELECT 1 FROM game_sessions WHERE session_code = $1', [code]);
  return (res.rowCount ?? 0) > 0;
}
