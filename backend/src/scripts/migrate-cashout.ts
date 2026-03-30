import "dotenv/config";
import pool from "../db/pool";

const migrate = async () => {
  const client = await pool.connect();

  try {
    console.log("Adding column 'cash_out_submitted' to 'session_players'...");
    await client.query(`
      ALTER TABLE session_players 
      ADD COLUMN IF NOT EXISTS cash_out_submitted BOOLEAN DEFAULT FALSE;
    `);
    console.log("Migration successful.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();
