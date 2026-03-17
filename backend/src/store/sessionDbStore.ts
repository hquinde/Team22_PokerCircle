import pool from '../db/pool';
import { Session, Player } from '../types/session';

function normalizeSessionCode(sessionCode: string): string {
  return sessionCode.trim().toUpperCase();
}

export async function getSessionWithPlayers(sessionCode: string): Promise<Session | null> {
  const code = normalizeSessionCode(sessionCode);

  const sessionRes = await pool.query(
    'SELECT session_code, host_user_id, status, game_state, created_at FROM game_sessions WHERE session_code = $1',
    [code]
  );

  if (sessionRes.rowCount === 0) return null;

  const playersRes = await pool.query(
    `SELECT id, display_name, is_ready, joined_at
     FROM session_players
     WHERE session_code = $1
     ORDER BY joined_at ASC`,
    [code]
  );

  const sessionRow = sessionRes.rows[0];

  return {
    sessionCode: sessionRow.session_code,
    hostUserId: sessionRow.host_user_id,
    status: sessionRow.status,
    gameState: sessionRow.game_state,
    createdAt: sessionRow.created_at,
    players: playersRes.rows.map((r) => ({
      playerId: String(r.id),
      displayName: r.display_name,
      isReady: r.is_ready,
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

  await pool.query(
    'INSERT INTO session_players (session_code, display_name) VALUES ($1, $2)',
    [code, name]
  );

  return getSessionWithPlayers(code);
}

export async function createSessionInDb(sessionCode: string, hostUserId: string): Promise<Session> {
  const code = normalizeSessionCode(sessionCode);

  const insertRes = await pool.query(
    'INSERT INTO game_sessions (session_code, host_user_id) VALUES ($1, $2) RETURNING session_code, host_user_id, status, game_state, created_at',
    [code, hostUserId]
  );

  const row = insertRes.rows[0];
  return {
    sessionCode: row.session_code,
    hostUserId: row.host_user_id,
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
    'UPDATE game_sessions SET status = $1 WHERE session_code = $2 RETURNING session_code',
    [status, code]
  );

  if (updateRes.rowCount === 0) return null;

  return getSessionWithPlayers(code);
}

export async function updatePlayerReady(
  sessionCode: string,
  displayName: string,
  isReady: boolean
): Promise<boolean> {
  const code = normalizeSessionCode(sessionCode);
  const name = displayName.trim();

  const result = await pool.query(
    'UPDATE session_players SET is_ready = $1 WHERE session_code = $2 AND display_name = $3',
    [isReady, code, name]
  );

  return (result.rowCount ?? 0) > 0;
}

export async function sessionExistsInDb(sessionCode: string): Promise<boolean> {
  const code = normalizeSessionCode(sessionCode);
  const res = await pool.query('SELECT 1 FROM game_sessions WHERE session_code = $1', [code]);
  return (res.rowCount ?? 0) > 0;
}
