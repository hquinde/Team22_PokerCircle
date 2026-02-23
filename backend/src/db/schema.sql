CREATE TABLE IF NOT EXISTS users (
  "userID"   TEXT  PRIMARY KEY,
  username   TEXT  NOT NULL,
  email      TEXT  NOT NULL UNIQUE,
  password   TEXT  NOT NULL
);

CREATE TABLE IF NOT EXISTS "session" (
  "sid"    varchar        NOT NULL COLLATE "default",
  "sess"   json           NOT NULL,
  "expire" timestamp(6)   NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "session"
  ADD CONSTRAINT "session_pkey"
  PRIMARY KEY ("sid") DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
