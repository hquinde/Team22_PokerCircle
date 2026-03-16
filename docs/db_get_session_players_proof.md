# DB GET Session + Players Proof (TM22-60)

This document demonstrates that the backend database prototype correctly stores and retrieves session and player data.
The test verifies that a session can be created, players can join, and the current lobby state can be retrieved through the API.

---

## Test Environment

Backend: Node.js + Express  
Database: PostgreSQL (local development)  
Endpoint base URL: http://localhost:3000/api

---

## Step 1 — Create Session

Request

POST http://localhost:3000/api/sessions

Response

{
  "sessionId": 6,
  "sessionCode": "BZ6KWN",
  "createdAt": "2026-03-03T07:36:41.870Z",
  "players": []
}

Result

- A new session record is inserted into the game_sessions table.
- A unique session code is generated.
- No players exist yet in the session.

---

## Step 2 — Join Players

Players join the session using the generated session code.

Requests

POST http://localhost:3000/api/sessions/BZ6KWN/join
Body:
{
  "displayName": "Ana"
}

POST http://localhost:3000/api/sessions/BZ6KWN/join
Body:
{
  "displayName": "Bob"
}

Result

- Two player records are inserted into the players table.
- Each player references the session through the sessionId foreign key.
- Database constraints ensure valid session references and prevent invalid entries.

---

## Step 3 — Fetch Lobby State

Request

GET http://localhost:3000/api/sessions/BZ6KWN

Response

{
  "sessionId": 6,
  "sessionCode": "BZ6KWN",
  "createdAt": "2026-03-03T07:36:41.870Z",
  "players": [
    {
      "playerId": 7,
      "displayName": "Ana",
      "joinedAt": "2026-03-03T07:37:47.221Z"
    },
    {
      "playerId": 8,
      "displayName": "Bob",
      "joinedAt": "2026-03-03T07:37:57.927Z"
    }
  ]
}

Result

- The API returns the session and all associated players.
- Player records are retrieved from the database and attached to the session response.
- This confirms the relational link between game_sessions and players.

---

## Verification

This test confirms:

- Session creation persists to the database.
- Players can join an existing session.
- Player records correctly reference their session.
- The session endpoint returns the complete lobby state.

---

## Conclusion

The database prototype successfully supports the core lobby functionality:

Create Session → Join Players → Retrieve Lobby State

This functionality forms the foundation for the multiplayer lobby system and will support future features such as real-time lobby synchronization and game state updates.
