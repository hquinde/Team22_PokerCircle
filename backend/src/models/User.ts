import pool from '../db/pool';
import type { User } from '../types/user';

class UserModel {
  userID: string;
  username: string;
  email: string;
  password?: string;

  constructor(user: User) {
    this.userID = user.userID;
    this.username = user.username;
    this.email = user.email;
    this.password = user.password;
  }

  async save(): Promise<void> {
    await pool.query(
      'INSERT INTO users ("userID", username, email, password) VALUES ($1, $2, $3, $4)',
      [this.userID, this.username, this.email, this.password],
    );
  }

  static async findById(userID: string): Promise<UserModel | null> {
    const result = await pool.query<User>(
      'SELECT "userID", username, email, password FROM users WHERE "userID" = $1',
      [userID],
    );
    const row = result.rows[0];
    if (!row) return null;
    return new UserModel(row);
  }

  static async findByEmail(email: string): Promise<UserModel | null> {
    const result = await pool.query<User>(
      'SELECT "userID", username, email, password FROM users WHERE email = $1',
      [email],
    );
    const row = result.rows[0];
    if (!row) return null;
    return new UserModel(row);
  }

  static async search(query: string): Promise<UserModel[]> {
    const result = await pool.query<User>(
      'SELECT "userID", username, email FROM users WHERE username ILIKE $1',
      [`%${query}%`],
    );
    return result.rows.map((row) => new UserModel(row));
  }
}

export default UserModel;
