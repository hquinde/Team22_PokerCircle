export type User = {
  user_id: string;
  username: string;
  email: string;
  password_hash: string;
  total_balance: number;
  created_at: string;
  updated_at: string;
};

export type UserSummary = {
  id: string;
  displayName: string;
};
