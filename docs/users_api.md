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
    },
    {
      "id": "uuid-456",
      "displayName": "logan_poker"
    }
  ]
}
```

### 400 Bad Request
Returned when the query is missing or too short.

```json
{
  "error": "Query too short"
}
```

## Examples

### Successful search
`GET /api/users/search?q=log`

### Search with no results
`GET /api/users/search?q=nonexistentuser`

### Too-short query
`GET /api/users/search?q=lo`
