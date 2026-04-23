import "dotenv/config";
import pool from "../db/pool";

const addNotificationPreferences = async () => {
  const client = await pool.connect();

  try {
    console.log("Adding notification_preferences column to users table...");

    const query = `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS notification_preferences JSONB
      DEFAULT '{"friendRequests": true, "sessionInvites": true}'::jsonb;
    `;

    await client.query(query);
    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Error running migration:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

addNotificationPreferences();
