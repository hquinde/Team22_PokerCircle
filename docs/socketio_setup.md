# Socket.IO Setup (Backend)

## Purpose
Verify that Socket.IO is correctly attached to the Express HTTP server and that connect/disconnect events fire.

## Run the backend
From `backend/`:

```bash
npm install
npm run dev
```
## In a second terminal (from backend/)
npx ts-node scripts/socket_test_client.ts

## When the client runs, the server logs should show:
User connected: <socket.id>
User disconnected: <socket.id>
