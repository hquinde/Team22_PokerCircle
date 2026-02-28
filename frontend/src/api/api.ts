import type { Session } from '../types/session';

const BASE_URL = 'http://localhost:3000';

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
