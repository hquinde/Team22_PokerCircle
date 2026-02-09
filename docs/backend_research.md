# Backend Framework & Real-Time Communication Research (PokerCircle)

## Goal
PokerCircle needs a backend that supports:
- Many concurrent connections (multiple sessions, multiple players per session)
- Low-latency updates (player joins/leaves, buy-ins, chip totals, payouts)
- Rapid iteration for a semester-long team project
- Maintainability and clear team workflow

This document evaluates:
1) Backend frameworks: **Node.js** vs **FastAPI**
2) Real-time communication: **Socket.IO** vs **native WebSockets**

---

## Option A: Node.js (JavaScript/TypeScript)
### Strengths
- **Concurrency model fits real-time well:** Node’s event loop is designed for I/O-heavy workloads (many clients sending small messages).
- **Large ecosystem for real-time + web:** Socket.IO and many libraries simplify common needs (auth middleware, rate limiting, logging).
- **Developer velocity:** Frontend and backend can share language (JS/TS), which reduces context switching.
- **Industry-standard patterns:** Express/NestJS style APIs are widely documented and easy to debug.

### Risks / Weaknesses
- If the team avoids TypeScript, code quality can slip (harder to refactor).
- CPU-heavy tasks require extra care (worker threads / offloading). For PokerCircle, this is likely minimal.

---

## Option B: FastAPI (Python ASGI)
### Strengths
- **Excellent developer experience for APIs:** automatic OpenAPI docs, request validation via Pydantic, very readable code.
- **Good async support (ASGI):** FastAPI supports async endpoints and can handle concurrent I/O well when used correctly.
- **Strong for data-centric logic:** If the team is comfortable with Python, implementing business logic can be clean and fast.

### Risks / Weaknesses
- Real-time support is doable but often requires more careful setup (e.g., choosing the right WebSocket approach, deployment config).
- If the team is already using JavaScript/TypeScript on the frontend, Python adds language/tooling overhead.

---

## Performance Discussion
### Concurrency Handling
- **Node.js:** Single-threaded event loop handles many concurrent I/O operations efficiently. Great for chat-like or “room update” style workloads.
- **FastAPI (ASGI):** Async can also handle concurrent I/O well, but performance and correctness depend on:
  - using async properly (avoid blocking calls),
  - correct server setup (Uvicorn/Gunicorn workers),
  - careful deployment configuration.

**Verdict:** Both can work. Node generally has fewer footguns for a student team building real-time features quickly.

### Developer Productivity
- **Node.js:** fastest path if the team is already working in JS/TS. Huge library support for real-time and web tooling.
- **FastAPI:** extremely productive for building clean REST APIs quickly, especially if the team likes Python + auto-docs.

**Verdict:** Node wins if the team wants a single language across stack. FastAPI wins if the team is significantly stronger in Python.

---

## Real-Time Communication Options

### Option 1: Socket.IO
**What it provides**
- Automatic reconnection
- Event-based messaging (e.g., `join_session`, `player_updated`)
- Built-in support for **Rooms** (perfect for “one room per poker session”)
- Broad client support and lots of examples

**PokerCircle fit**
- Each poker session = a Socket.IO room
- Broadcast updates only to players in that session
- Easy to manage:
  - join/leave events,
  - session state updates,
  - host permissions (server-side checks)

**Pros**
- Most reliable and easiest integration
- Reconnection + fallback transport are big practical wins

**Cons**
- Slight overhead vs raw websockets (usually not a problem for this project)
- Adds a dependency and “Socket.IO style” event conventions

---

### Option 2: Native WebSockets
**What it provides**
- Raw, low-level bi-directional connection

**PokerCircle fit**
- Works fine, but requires you to build:
  - reconnection logic
  - room management conventions
  - message envelope format (type + payload)
  - heartbeat/ping handling
  - error handling patterns

**Pros**
- Lighter-weight protocol control
- No extra abstraction

**Cons**
- More engineering effort and more ways to make mistakes
- Less “out of the box” reliability

---

## Recommendation

### Recommended Backend Framework: **Node.js (TypeScript preferred)**
**Why**
- Best match for real-time session updates and many concurrent connections.
- Smooth integration with Socket.IO and room-based messaging.
- Faster team iteration if frontend is already JS/TS.
- Lower integration risk for a semester-long build.

### Recommended Real-Time Approach: **Socket.IO**
**Why**
- Rooms map directly to PokerCircle sessions (“table isolation”).
- Reliable reconnection behavior matters in real mobile networks.
- Less custom plumbing than native WebSockets.

---

## Proposed Architecture (Sprint 1 Decision)
- **Backend:** Node.js + Express (or NestJS if the team prefers structure)
- **Real-time:** Socket.IO
- **API style:** REST endpoints for CRUD + Socket events for live updates

Example responsibility split:
- REST: create session, fetch session state, authentication, user profiles
- Socket.IO: live session updates, player join/leave notifications, state broadcasts

---

## Next Steps
1) Confirm team comfort with TypeScript vs JavaScript
2) Prototype:
   - `GET /ping` endpoint
   - Socket.IO server with `join_session` + broadcast message
3) Decide deployment target (Render/Fly.io/Railway/AWS later)
4) Document event naming conventions and message payload structure

---

## Subtasks Mapping (for Jira traceability)
- Compare Node event loop vs Python ASGI concurrency → **Performance / Concurrency section**
- Research Socket.IO rooms for game table isolation → **Socket.IO section**
- Compare reconnection reliability vs raw WebSockets → **Socket.IO vs Native WS section**
