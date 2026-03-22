import "dotenv/config";
import { Pool } from 'pg';

const connectionString = process.env["DATABASE_URL"];
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Supabase (and Railway Postgres) both require SSL.
// rejectUnauthorized: false is needed because they use self-signed / managed certs
// that the pg client won't trust by default.
// This is safe — the connection is still encrypted; we're just not pinning the CA cert.
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

export default pool;
