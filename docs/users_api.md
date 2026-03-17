# Users API

## Search Users

Search for users by their username with partial match.

**Endpoint:** `GET /api/users/search`

**Query Parameters:**
- `q`: The search term (string). Must be at least 3 characters long.

**Responses:**

### 200 OK
Returns a list of matching users.

```json
{
  "results": [
    {
      "id": "uuid-123",
      "displayName": "Logan"
    }
  ]
}
```

---

## Send Friend Request (Auth Required)

Sends a friend request to another user.

**Endpoint:** `POST /api/users/friend-request`

**Request Body:**
- `receiverId` (UUID, required): The ID of the user to receive the request.

**Responses:**

### 201 Created
```json
{
  "message": "Friend request sent"
}
```

### 400 Bad Request
If `receiverId` is missing or user tries to request themselves.

### 404 Not Found
If the receiver user doesn't exist.

### 409 Conflict
If a request already exists between these users.

---

## Get Pending Friend Requests (Auth Required)

Retrieves a list of users who have sent a pending friend request to the logged-in user.

**Endpoint:** `GET /api/users/friend-requests/pending`

**Responses:**

### 200 OK
```json
{
  "results": [
    {
      "id": "uuid-abc",
      "displayName": "Alice"
    }
  ]
}
```
