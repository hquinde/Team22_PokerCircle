# Sessions API

## Create Session
Creates a new poker session and returns a unique 6-character session code.

### Endpoint
POST `/api/sessions`

### Request Body
None (MVP).

### Success Response
**201 Created**
```json
{
  "sessionCode": "WO6YX4",
  "createdAt": "2026-02-17T19:05:38.321Z",
  "players": []
}
