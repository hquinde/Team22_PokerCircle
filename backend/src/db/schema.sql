CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  total_balance BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friend Requests table
CREATE TABLE IF NOT EXISTS friend_requests (
  id SERIAL PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_self_request CHECK (sender_id != receiver_id),
  CONSTRAINT unique_friend_request UNIQUE (sender_id, receiver_id)
);

-- Express-session store table (connect-pg-simple)
CREATE TABLE IF NOT EXISTS "session" (
  "sid"    varchar        NOT NULL COLLATE "default",
  "sess"   json           NOT NULL,
  "expire" timestamp(6)   NOT NULL
)
WITH (OIDS=FALSE);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'session_pkey'
      AND conrelid = 'session'::regclass
  ) THEN
    ALTER TABLE "session"
      ADD CONSTRAINT "session_pkey"
      PRIMARY KEY ("sid") DEFERRABLE INITIALLY IMMEDIATE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- Game sessions
CREATE TABLE IF NOT EXISTS game_sessions (
  session_code VARCHAR(6) PRIMARY KEY,
  host_user_id UUID NOT NULL REFERENCES users(user_id),
  status VARCHAR(20) NOT NULL DEFAULT 'lobby',
  game_state JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Players in a game session (persisted lobby membership)
CREATE TABLE IF NOT EXISTS session_players (
  id SERIAL PRIMARY KEY,
  session_code VARCHAR(6) NOT NULL REFERENCES game_sessions(session_code) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  is_ready BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_player_name_per_session UNIQUE (session_code, display_name)
);

CREATE INDEX IF NOT EXISTS idx_session_players_session_code
  ON session_players(session_code);
