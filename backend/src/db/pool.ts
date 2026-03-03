import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";

const connectionString = process.env["DATABASE_URL"];
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });

export default pool;
console.log("DATABASE_URL exists:", Boolean(process.env["DATABASE_URL"]));