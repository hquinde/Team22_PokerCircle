import "dotenv/config";
import pool from "../db/pool";

const initDb = async () => {
  const client = await pool.connect();

  try {
    console.log("Creating tables...");

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        total_balance BIGINT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Lobby sessions (NOT express-session "session" table)
    await client.query(`
      CREATE TABLE IF NOT EXISTS game_sessions (
        session_code VARCHAR(6) PRIMARY KEY,
        host_user_id UUID NOT NULL REFERENCES users(user_id),
        status VARCHAR(20) NOT NULL DEFAULT 'lobby',
        game_state JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Players in a lobby
    await client.query(`
      CREATE TABLE IF NOT EXISTS session_players (
        id SERIAL PRIMARY KEY,
        session_code VARCHAR(6) NOT NULL,
        display_name TEXT NOT NULL,
        is_ready BOOLEAN NOT NULL DEFAULT FALSE,
        joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

        CONSTRAINT fk_session_players_session
          FOREIGN KEY (session_code)
          REFERENCES game_sessions(session_code)
          ON DELETE CASCADE,

        CONSTRAINT unique_player_name_per_session UNIQUE (session_code, display_name)
      );
    `);

    console.log("Tables created successfully.");
  } catch (error) {
    console.error("Error creating tables:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end(); // optional but helps scripts exit cleanly
  }
};

initDb();
