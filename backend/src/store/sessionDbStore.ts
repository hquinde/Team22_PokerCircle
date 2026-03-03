import pool from '../db/pool';

export type DbPlayer = {
  id: number;
  displayName: string;
  joinedAt: string;
};

export type DbSession = {
  sessionCode: string;
  createdAt: string;
  players: DbPlayer[];
};

function normalizeSessionCode(sessionCode: string): string {
  return sessionCode.trim().toUpperCase();
}

export async function createGameSession(): Promise<DbSession> {
  // generate code in route (you already have generateSessionCode), then insert here if you want
  // but keeping creation in the route is also fine. This helper is optional.
  throw new Error('Not implemented');
}

export async function getSessionWithPlayers(sessionCode: string): Promise<DbSession | null> {
  const code = normalizeSessionCode(sessionCode);

  const sessionRes = await pool.query(
    'SELECT session_code, created_at FROM game_sessions WHERE session_code = $1',
    [code]
  );

  if (sessionRes.rowCount === 0) return null;

  const playersRes = await pool.query(
    `SELECT id, display_name, joined_at
     FROM session_players
     WHERE session_code = $1
     ORDER BY joined_at ASC`,
    [code]
  );

  return {
    sessionCode: sessionRes.rows[0].session_code,
    createdAt: sessionRes.rows[0].created_at,
    players: playersRes.rows.map((r) => ({
      id: r.id as number,
      displayName: r.display_name as string,
      joinedAt: r.joined_at as string,
    })),
  };
}

export async function addPlayerToSession(
  sessionCode: string,
  displayName: string
): Promise<DbSession | null> {
  const code = normalizeSessionCode(sessionCode);
  const name = displayName.trim();

  const existsRes = await pool.query('SELECT 1 FROM game_sessions WHERE session_code = $1', [code]);
  if (existsRes.rowCount === 0) return null;

  await pool.query(
    'INSERT INTO session_players (session_code, display_name) VALUES ($1, $2)',
    [code, name]
  );

  return getSessionWithPlayers(code);
}

export async function createSessionInDb(sessionCode: string): Promise<DbSession> {
  const code = normalizeSessionCode(sessionCode);

  const insertRes = await pool.query(
    'INSERT INTO game_sessions (session_code) VALUES ($1) RETURNING session_code, created_at',
    [code]
  );

  return {
    sessionCode: insertRes.rows[0].session_code,
    createdAt: insertRes.rows[0].created_at,
    players: [],
  };
}

export async function sessionExistsInDb(sessionCode: string): Promise<boolean> {
  const code = normalizeSessionCode(sessionCode);
  const res = await pool.query('SELECT 1 FROM game_sessions WHERE session_code = $1', [code]);
  return (res.rowCount ?? 0) > 0;
}