import type { Session, SessionStatus } from '../types/session';
import { BACKEND_URL } from '../config/api';

export type UserSummary = {
  id: string;
  displayName: string;
};

export async function getSession(sessionCode: string): Promise<Session> {
  const response = await fetch(`${BACKEND_URL}/api/sessions/${sessionCode}`, {
    credentials: 'include',
  });
  if (response.status === 404) {
    throw Object.assign(new Error('Session not found'), { statusCode: 404 });
  }
  if (!response.ok) {
    throw new Error('Failed to fetch session');
  }
  return response.json() as Promise<Session>;
}

export async function createSession(): Promise<Session> {
  const response = await fetch(`${BACKEND_URL}/api/sessions`, {
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
  const response = await fetch(`${BACKEND_URL}/api/sessions/${sessionCode}/join`, {
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
  const response = await fetch(`${BACKEND_URL}/api/sessions/${sessionCode}/ready`, {
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
  const response = await fetch(`${BACKEND_URL}/api/sessions/${sessionCode}/start`, {
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

export async function updatePlayerFinances(
  sessionCode: string,
  displayName: string,
  finances: { buyIn?: number; rebuyTotal?: number; cashOut?: number }
): Promise<any> {
  const response = await fetch(`${BACKEND_URL}/api/sessions/${sessionCode}/players/${displayName}/finances`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(finances),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? 'Failed to update finances');
  }
  return response.json();
}

export async function completeSession(sessionCode: string): Promise<Session> {
  const response = await fetch(`${BACKEND_URL}/api/sessions/${sessionCode}/complete`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? 'Failed to complete session');
  }
  return response.json() as Promise<Session>;
}

export async function getSessionResults(sessionCode: string): Promise<{
  playerResults: { displayName: string; netResult: number }[];
  transactions: { from: string; to: string; amount: number }[];
}> {
  const response = await fetch(`${BACKEND_URL}/api/sessions/${sessionCode}/results`);
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? 'Failed to fetch results');
  }
  return response.json();
}

export async function updateSessionStatus(sessionCode: string, status: SessionStatus): Promise<Session> {
  const response = await fetch(`${BACKEND_URL}/api/sessions/${sessionCode}/status`, {
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
  const response = await fetch(`${BACKEND_URL}/api/users/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to search users');
  }
  const data = await response.json();
  return data.results as UserSummary[];
}

export async function sendFriendRequest(receiverId: string): Promise<{ message: string }> {
  const response = await fetch(`${BACKEND_URL}/api/users/friend-request`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiverId }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? 'Failed to send friend request');
  }
  return response.json() as Promise<{ message: string }>;
}

export async function getPendingFriendRequests(): Promise<UserSummary[]> {
  const response = await fetch(`${BACKEND_URL}/api/users/friend-requests/pending`, {
    credentials: 'include',
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? 'Failed to fetch pending requests');
  }
  const data = await response.json();
  return data.results as UserSummary[];
}
