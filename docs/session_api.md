# Sessions API

Base path: `/api/sessions`

All responses are JSON unless otherwise noted.

---

## Session Object

| Field | Type | Description |
|---|---|---|
| `sessionId` | `number` | Unique internal database ID |
| `sessionCode` | `string` | 6-character unique session code |
| `status` | `string` | Session status: `lobby`, `starting`, `active`, `finished` |
| `gameState` | `object` | JSON object containing current poker game state |
| `createdAt` | `string` | ISO timestamp of session creation |
| `players` | `array` | List of players in the session |

---

## Create Session

### POST `/api/sessions`

Creates a new session with a unique 6-character session code. Initial status is `lobby`.

**Request Body**
- None

**Success Response**
- Status: `201 Created`
- Body:
```json
{
  "sessionId": 12,
  "sessionCode": "34ZRHE",
  "status": "lobby",
  "gameState": {},
  "createdAt": "2026-03-16T10:00:00.000Z",
  "players": []
}
```

---

## Get Session By Code

### GET `/api/sessions/:sessionCode`

Fetches an existing session by session code. Used by the Lobby screen to load current lobby state and by the Game screen to load game state.

**Path Parameters**
- `sessionCode` (string): 6-character session code

**Success Response**
- Status: `200 OK`
- Body:
```json
{
  "sessionId": 5,
  "sessionCode": "38V45J",
  "status": "lobby",
  "gameState": {},
  "createdAt": "2026-03-16T10:00:00.000Z",
  "players": [
    {
      "playerId": 1,
      "displayName": "Alice",
      "joinedAt": "2026-03-16T10:05:00.000Z"
    }
  ]
}
```

---

## Join Session

### POST `/api/sessions/:sessionCode/join`

Adds a player to an existing session and returns the updated session.

**Path Parameters**
- `sessionCode` (string): 6-character session code

**Request Body**
```json
{
  "displayName": "Logan"
}
```

**Success Response**
- Status: `200 OK`
- Body:
```json
{
  "sessionId": 8,
  "sessionCode": "B94T6S",
  "status": "lobby",
  "gameState": {},
  "createdAt": "2026-03-16T10:00:00.000Z",
  "players": [
    {
      "playerId": 3,
      "displayName": "Logan",
      "joinedAt": "2026-03-16T10:10:00.000Z"
    }
  ]
}
```

---

## Update Session Status

### PATCH `/api/sessions/:sessionCode/status`

Updates the session status (e.g., transition from `lobby` to `starting`).

**Path Parameters**
- `sessionCode` (string): 6-character session code

**Request Body**
```json
{
  "status": "starting"
}
```

- `status` (string, required): One of `lobby`, `starting`, `active`, `finished`.

**Success Response**
- Status: `200 OK`
- Body:
```json
{
  "sessionId": 8,
  "sessionCode": "B94T6S",
  "status": "starting",
  "gameState": {},
  "createdAt": "2026-03-16T10:00:00.000Z",
  "players": [...]
}
```
