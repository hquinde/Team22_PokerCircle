import "dotenv/config";
import pool from "../db/pool";
import fs from "fs";
import path from "path";

const runMigration = async () => {
  const client = await pool.connect();

  try {
    const schemaPath = path.join(__dirname, "../db/schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");

    console.log("Running migration...");
    await client.query(schema);
    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Error running migration:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

runMigration();
