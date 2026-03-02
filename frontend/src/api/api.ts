import type { Session } from '../types/session';

const BASE_URL = 'http://localhost:3000';

export type UserSummary = {
  id: string;
  displayName: string;
};

export async function getSession(sessionCode: string): Promise<Session> {
  const response = await fetch(`${BASE_URL}/api/sessions/${sessionCode}`);
  if (response.status === 404) {
    throw Object.assign(new Error('Session not found'), { statusCode: 404 });
  }
  if (!response.ok) {
    throw new Error('Failed to fetch session');
  }
  return response.json() as Promise<Session>;
}

export async function searchUsers(query: string): Promise<UserSummary[]> {
  const response = await fetch(`${BASE_URL}/api/users/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to search users');
  }
  const data = await response.json();
  return data.results as UserSummary[];
}
