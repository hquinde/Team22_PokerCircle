import pool from '../db/pool';
import type { User, UserSummary } from '../types/user';

class UserModel {
  user_id: string;
  username: string;
  email: string;
  password_hash: string;
  total_balance: number;
  created_at: string;
  updated_at: string;

  constructor(user: User) {
    this.user_id = user.user_id;
    this.username = user.username;
    this.email = user.email;
    this.password_hash = user.password_hash;
    this.total_balance = user.total_balance;
    this.created_at = user.created_at;
    this.updated_at = user.updated_at;
  }

  static async findById(user_id: string): Promise<UserModel | null> {
    const result = await pool.query<User>(
      'SELECT * FROM users WHERE user_id = $1',
      [user_id],
    );
    const row = result.rows[0];
    if (!row) return null;
    return new UserModel(row);
  }

  static async findByEmail(email: string): Promise<UserModel | null> {
    const result = await pool.query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email],
    );
    const row = result.rows[0];
    if (!row) return null;
    return new UserModel(row);
  }

  static async search(query: string): Promise<UserSummary[]> {
    const result = await pool.query<{ user_id: string; username: string }>(
      'SELECT user_id, username FROM users WHERE username ILIKE $1',
      [`%${query}%`],
    );
    return result.rows.map((row) => ({
      id: row.user_id,
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
    const result = await pool.query<{ user_id: string; username: string }>(
      `SELECT u.user_id, u.username 
       FROM users u
       JOIN friend_requests fr ON fr.sender_id = u.user_id
       WHERE fr.receiver_id = $1 AND fr.status = 'pending'`,
      [userId]
    );
    return result.rows.map(row => ({
      id: row.user_id,
      displayName: row.username
    }));
  }
}

export default UserModel;
