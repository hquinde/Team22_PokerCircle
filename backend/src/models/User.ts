import pool from '../db/pool';
import type { User, UserSummary } from '../types/user';

class UserModel {
  userID: string;
  username: string;
  email: string;
  password?: string;
  total_balance: number;
  created_at: string;
  updated_at: string;

  constructor(user: User) {
    this.userID = user.userID;
    this.username = user.username;
    this.email = user.email;
    this.password = user.password;
    this.total_balance = user.total_balance ?? 0;
    this.created_at = user.created_at ?? new Date().toISOString();
    this.updated_at = user.updated_at ?? new Date().toISOString();
  }

  async save(): Promise<void> {
    await pool.query(
      'INSERT INTO users (user_id, username, email, password_hash) VALUES ($1, $2, $3, $4)',
      [this.userID, this.username, this.email, this.password],
    );
  }

  static async findById(userID: string): Promise<UserModel | null> {
    const result = await pool.query<User>(
      'SELECT user_id AS "userID", username, email, password_hash AS password, total_balance, created_at, updated_at FROM users WHERE user_id = $1',
      [userID],
    );
    const row = result.rows[0];
    if (!row) return null;
    return new UserModel(row);
  }

  static async findByEmail(email: string): Promise<UserModel | null> {
    const result = await pool.query<User>(
      'SELECT user_id AS "userID", username, email, password_hash AS password, total_balance, created_at, updated_at FROM users WHERE email = $1',
      [email],
    );
    const row = result.rows[0];
    if (!row) return null;
    return new UserModel(row);
  }

  static async search(query: string): Promise<UserSummary[]> {
    const result = await pool.query<{ userID: string; username: string }>(
      'SELECT user_id AS "userID", username FROM users WHERE username ILIKE $1',
      [`%${query}%`],
    );
    return result.rows.map((row) => ({
      id: row.userID,
      displayName: row.username,
    }));
  }

  static async sendFriendRequest(senderId: string, receiverId: string): Promise<void> {
    await pool.query(
      'INSERT INTO friend_requests (sender_id, receiver_id) VALUES ($1, $2)',
      [senderId, receiverId]
    );
  }

  static async getPendingFriendRequests(userId: string): Promise<UserSummary[]> {
    const result = await pool.query<{ userID: string; username: string }>(
      `SELECT u.user_id AS "userID", u.username 
       FROM users u
       JOIN friend_requests fr ON fr.sender_id = u.user_id
       WHERE fr.receiver_id = $1 AND fr.status = 'pending'`,
      [userId]
    );
    return result.rows.map(row => ({
      id: row.userID,
      displayName: row.username
    }));
  }
}

export default UserModel;
