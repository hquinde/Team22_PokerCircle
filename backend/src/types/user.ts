export type User = {
  userID: string;
  username: string;
  email: string;
  password?: string;
  total_balance?: number;
  created_at?: string;
  updated_at?: string;
};

export type UserSummary = {
  id: string;
  displayName: string;
};
