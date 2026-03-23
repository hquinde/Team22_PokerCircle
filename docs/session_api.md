# Sessions API

Base path: `/api/sessions`

All responses are JSON unless otherwise noted.

---

## Session Object

| Field | Type | Description |
|---|---|---|
| `sessionCode` | `string` | unique session code |
| `hostUserId` | `string` | UUID of the user who created the session |
| `status` | `string` | Session status: `waiting`, `starting`, `active`, `finished` |
| `gameState` | `object` | JSON object containing current poker game state |
| `createdAt` | `string` | ISO timestamp of session creation |
| `players` | `array` | List of players in the session |

### Player Object
| Field | Type | Description |
|---|---|---|
| `playerId` | `string` | Unique internal database ID |
| `displayName` | `string` | Name chosen by the player |
| `isReady` | `boolean` | Whether the player is ready to start |
| `buyIn` | `number` | Initial buy-in amount |
| `rebuyTotal` | `number` | Total amount of rebuys |
| `cashOut` | `number` | Final cash-out amount |
| `joinedAt` | `string` | ISO timestamp of when the player joined |

---

## Create Session (Auth Required)

### POST `/api/sessions`

Creates a new session with a unique session code. Initial status is `waiting`.

**Success Response**
- Status: `201 Created`
```json
{
  "sessionCode": "34ZRHE",
  "hostUserId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "status": "waiting",
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
  "status": "waiting",
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

## Update Player Finances

### PATCH `/api/sessions/:sessionCode/players/:displayName/finances`

Update a player's buy-in, rebuy, or cash-out values.

**Request Body**
```json
{
  "buyIn": 100,
  "rebuyTotal": 50,
  "cashOut": 200
}
```

---

## Start Game (Host Only)

### POST `/api/sessions/:sessionCode/start`

Transitions session to `active` status and notifies players via Socket.IO. Minimum 2 players required, all must be ready.

---

## Complete Session (Host Only)

### POST `/api/sessions/:sessionCode/complete`

Finalizes the game session. Transitions status to `finished`.

---

## Get Settlement Results

### GET `/api/sessions/:sessionCode/results`

Calculates net results for all players and produces the minimum transaction settlement plan.

**Success Response**
- Status: `200 OK`
```json
{
  "playerResults": [
    { "displayName": "Alice", "netResult": 50 },
    { "displayName": "Bob", "netResult": -50 }
  ],
  "transactions": [
    { "from": "Bob", "to": "Alice", "amount": 50 }
  ]
}
```

---

## Update Session Status

### PATCH `/api/sessions/:sessionCode/status`

**Request Body**
```json
{
  "status": "active"
}
```
