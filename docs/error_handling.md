# Error Handling Contract (PokerCircle Backend)

All error responses are JSON.

## Unknown route (404)
Status: 404
Body:
{ "error": "Not Found" }

## Application errors
Status: uses res.statusCode if set (and not 200), otherwise 500
Body:
{ "error": "<message>" }

## How to test

### 404 test
GET /api/does-not-exist

Expected:
- 404
- { "error": "Not Found" }

### 500 test (dev-only)
When NODE_ENV != "production":
GET /api/debug/error

Expected:
- 500
- { "error": "Debug forced error" }
