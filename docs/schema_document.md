# Artifact: Logical Data Structure (Simplified Poker Ledger)

## 1. Schema Map

### Users (Accounts & Global Wallet)
- `user_id`: UUID (PK)
- `username`: VARCHAR(50)
- `total_balance`: BIGINT (Stored in cents/chips)
- `updated_at`: TIMESTAMPTZ

### Tables (Game Rooms)
- `table_id`: UUID (PK)
- `name`: VARCHAR(100)
- `min_buy_in`: BIGINT
- `max_buy_in`: BIGINT
- `is_active`: BOOLEAN

### Sessions (Player Table Presence)
- `session_id`: UUID (PK)
- `user_id`: UUID (FK)
- `table_id`: UUID (FK)
- `start_stack`: BIGINT (The initial buy-in)
- `end_stack`: BIGINT (The final amount when leaving)
- `status`: ENUM ('active', 'closed')
- `created_at`: TIMESTAMPTZ

### Transactions (The Audit Trail)
- `txn_id`: UUID (PK)
- `user_id`: UUID (FK)
- `session_id`: UUID (FK)
- `amount`: BIGINT (Negative for buy-ins, positive for payouts)
- `txn_type`: VARCHAR (e.g., 'INITIAL_BUY_IN', 'RE_BUY', 'SESSION_PAYOUT')
- `created_at`: TIMESTAMPTZ
