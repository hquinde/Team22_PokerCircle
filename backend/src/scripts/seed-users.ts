import pool from "../db/pool";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const seedUsers = async () => {
  const users = [
    { username: "Logan", email: "logan@example.com", password: "password123" },
    { username: "logan_poker", email: "logan2@example.com", password: "password123" },
    { username: "Isabella", email: "isabella@example.com", password: "password123" },
    { username: "Isabelle", email: "isabelle@example.com", password: "password123" },
    { username: "John", email: "john@example.com", password: "password123" },
  ];

  const client = await pool.connect();
  try {
    console.log("Seeding users...");
    for (const user of users) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      const userID = crypto.randomUUID();
      await client.query(
        'INSERT INTO users (user_id, username, email, password_hash) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
        [userID, user.username, user.email, passwordHash]
      );
    }
    console.log("Users seeded successfully.");
  } catch (error) {
    console.error("Error seeding users:", error);
  } finally {
    client.release();
    process.exit(0);
  }
};

seedUsers();
