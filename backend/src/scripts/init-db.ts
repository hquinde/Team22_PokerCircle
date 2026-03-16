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
        id SERIAL PRIMARY KEY,
        session_code TEXT NOT NULL UNIQUE,
        status VARCHAR(20) NOT NULL DEFAULT 'lobby',
        game_state JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Players in a lobby
    await client.query(`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL,
        display_name TEXT NOT NULL,
        joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

        CONSTRAINT fk_players_session
          FOREIGN KEY (session_id)
          REFERENCES game_sessions(id)
          ON DELETE CASCADE,

        CONSTRAINT unique_player_name_per_session UNIQUE (session_id, display_name)
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
