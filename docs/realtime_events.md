# Real-time Socket.IO Events

## Architecture

The app uses a REST + WebSocket hybrid:
- **REST** — session creation, authentication, user profiles
- **Socket.IO** — real-time lobby updates (player join/leave)

One Socket.IO room per session, keyed by `sessionCode`. Clients join the room on LobbyScreen mount and leave on unmount.

---

## Events

### `session:joinRoom` — Client → Server

Emitted by the client when entering a lobby.

**Payload:**
```ts
{
  sessionCode: string;  // 6-character session code
  playerName: string;   // display name of the joining player
}
```

**Server behavior:**
1. Looks up session by `sessionCode`. Emits `error` if not found.
2. Adds the player (keyed by `socket.id`) to the session's player list if not already present.
3. Calls `socket.join(sessionCode)` to add the socket to the room.
4. Emits `lobby:update` to all clients in the room with the updated player list.

---

### `lobby:update` — Server → Room

Broadcast to all clients in a session room whenever the player list changes (join or leave).

**Payload:**
```ts
{
  sessionCode: string;
  players: { playerId: string; name: string }[];
}
```

---

### `error` — Server → Client

Emitted to the individual client when a socket operation fails.

**Payload:**
```ts
{
  message: string;
}
```

**Causes:**
- `session:joinRoom` called with a `sessionCode` that does not exist in the session store.

---

## Connection Lifecycle

### Frontend (LobbyScreen)

```
mount
  → fetch /api/auth/me (get username)
  → socket.connect()
  → socket.on('lobby:update', handler)
  → socket.on('error', handler)
  → socket.emit('session:joinRoom', { sessionCode, playerName })

unmount (cleanup)
  → socket.off('lobby:update')
  → socket.off('error')
  → socket.disconnect()
```

**Key:** `autoConnect: false` in the socket singleton (`src/services/socket.ts`) ensures the socket only connects when `socket.connect()` is explicitly called. This prevents stray connections and duplicate event listeners.

### Backend (disconnect cleanup)

On `disconnect`, the server iterates `socket.rooms`, removes the player from any session they were in, and emits `lobby:update` to the room with the updated (smaller) player list.
