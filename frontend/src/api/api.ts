import type { Session, SessionStatus } from '../types/session';

// In a real app, this might come from an environment variable.
// For local Expo development, you might need to use your machine's IP (e.g. 192.168.x.x:3000)
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

export async function createSession(): Promise<Session> {
  const response = await fetch(`${BASE_URL}/api/sessions`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? 'Failed to create session');
  }
  return response.json() as Promise<Session>;
}

export async function joinSession(sessionCode: string, displayName: string): Promise<Session> {
  const response = await fetch(`${BASE_URL}/api/sessions/${sessionCode}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? 'Failed to join session');
  }
  return response.json() as Promise<Session>;
}

export async function readySession(sessionCode: string, displayName: string, isReady: boolean): Promise<any> {
  const response = await fetch(`${BASE_URL}/api/sessions/${sessionCode}/ready`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName, isReady }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? 'Failed to update ready status');
  }
  return response.json();
}

export async function startSession(sessionCode: string): Promise<Session> {
  const response = await fetch(`${BASE_URL}/api/sessions/${sessionCode}/start`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? 'Failed to start session');
  }
  return response.json() as Promise<Session>;
}

export async function updateSessionStatus(sessionCode: string, status: SessionStatus): Promise<Session> {
  const response = await fetch(`${BASE_URL}/api/sessions/${sessionCode}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? 'Failed to update status');
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
