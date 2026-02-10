# PokerCircle Final Tech Stack Decision

## Overview
After evaluating frontend frameworks and backend technologies, the team selected the following stack for implementation in the next sprint:

- Frontend: React Native (TypeScript)  
- Backend: Node.js + Express (TypeScript)  
- Real-time Communication: Socket.IO  
- Database: PostgreSQL (planned)

---

## Frontend Decision: React Native

### Rationale
React Native was selected after comparing it with Flutter.

- Uses JavaScript/TypeScript, which aligns with the backend.
- Large ecosystem and strong documentation make development faster.
- Works well with real-time communication tools like Socket.IO.
- Lower learning curve compared to Flutter for this project timeline.

See the Frontend Framework Evaluation document for full comparison.

---

## Backend Decision: Node.js + Express

### Rationale
Node.js was selected after comparing it with FastAPI.

- Handles many concurrent connections well, which fits PokerCircle’s real-time session updates.
- Integrates easily with Socket.IO.
- Matches the frontend language (JavaScript/TypeScript), improving team productivity.
- A working Express backend already exists in the repository.

See backend_research.md for full comparison.

---

## Real-Time Communication: Socket.IO

### Rationale
Socket.IO was selected over native WebSockets.

- Built-in reconnection support improves reliability.
- Room-based architecture maps directly to poker sessions.
- Requires less custom implementation than raw WebSockets.

---

## Database Decision: PostgreSQL (Planned)

### Rationale
- PokerCircle will store structured data such as users, sessions, and transactions.
- Relational databases are well suited for this type of data.
- PostgreSQL is widely supported in Node.js environments.

---

## Record of Decision
This stack will be used for implementation starting in the next sprint.
