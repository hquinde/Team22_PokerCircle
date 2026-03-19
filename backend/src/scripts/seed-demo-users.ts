import "dotenv/config";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import pool from "../db/pool";

const DEMO_USERS = [
  { username: "DemoPlayer1", email: "demo1@pokercircle.dev", password: "000000" },
  { username: "DemoPlayer2", email: "demo2@pokercircle.dev", password: "000000" },
];

const seedDemoUsers = async () => {
  const client = await pool.connect();

  try {
    console.log("Seeding demo users...");

    for (const user of DEMO_USERS) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      const userID = crypto.randomUUID();

      await client.query(
        `INSERT INTO users (user_id, username, email, password_hash)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO NOTHING`,
        [userID, user.username, user.email, passwordHash],
      );

      console.log(`  ✓ ${user.username} (${user.email})`);
    }

    console.log("Demo users seeded successfully.");
  } catch (error) {
    console.error("Error seeding demo users:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

seedDemoUsers();
