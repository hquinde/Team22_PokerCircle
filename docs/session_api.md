# Sessions API

Base path: `/api/sessions`

All responses are JSON unless otherwise noted.

---

## Session Object

| Field | Type | Description |
|---|---|---|
| `sessionCode` | `string` | 6-character unique session code |
| `hostUserId` | `string` | UUID of the user who created the session |
| `status` | `string` | Session status: `lobby`, `starting`, `active`, `finished` |
| `gameState` | `object` | JSON object containing current poker game state |
| `createdAt` | `string` | ISO timestamp of session creation |
| `players` | `array` | List of players in the session |

### Player Object
| Field | Type | Description |
|---|---|---|
| `playerId` | `string` | Unique internal database ID |
| `displayName` | `string` | Name chosen by the player |
| `isReady` | `boolean` | Whether the player is ready to start |
| `joinedAt` | `string` | ISO timestamp of when the player joined |

---

## Create Session (Auth Required)

### POST `/api/sessions`

Creates a new session with a unique 6-character session code. Initial status is `lobby`.

**Success Response**
- Status: `201 Created`
```json
{
  "sessionCode": "34ZRHE",
  "hostUserId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "status": "lobby",
  "gameState": {},
  "createdAt": "2026-03-16T10:00:00.000Z",
  "players": []
}
```

---

## Get Session By Code

### GET `/api/sessions/:sessionCode`

**Success Response**
- Status: `200 OK`
```json
{
  "sessionCode": "38V45J",
  "hostUserId": "...",
  "status": "lobby",
  "gameState": {},
  "createdAt": "...",
  "players": [...]
}
```

---

## Join Session

### POST `/api/sessions/:sessionCode/join`

**Request Body**
```json
{
  "displayName": "Logan"
}
```

---

## Set Ready Status

### POST `/api/sessions/:sessionCode/ready`

**Request Body**
```json
{
  "displayName": "Logan",
  "isReady": true
}
```

---

## Start Game (Host Only)

### POST `/api/sessions/:sessionCode/start`

Transitions session to `starting` status and notifies players via Socket.IO.

---

## Update Session Status

### PATCH `/api/sessions/:sessionCode/status`

**Request Body**
```json
{
  "status": "active"
}
```
