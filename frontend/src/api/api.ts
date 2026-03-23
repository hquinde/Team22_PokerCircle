import type { Session } from '../types/session';
import type { Friend, FriendRequest, SessionInvite } from '../types/invite';
import { BACKEND_URL } from '../config/api';

export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted';
export type UserSearchResult = { userId: string; username: string; friendshipStatus: FriendshipStatus; friendshipId: number | null };

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

export async function getFriends(): Promise<Friend[]> {
  const response = await fetch(`${BACKEND_URL}/api/friends`, {
    credentials: 'include',
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? 'Failed to fetch friends');
  }
  const data = await response.json() as { friends: Friend[] };
  return data.friends;
}

export async function sendInvite(sessionCode: string, inviteeId: string): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/sessions/${sessionCode}/invite`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inviteeId }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? 'Failed to send invite');
  }
}

export async function getPendingInvites(): Promise<SessionInvite[]> {
  const response = await fetch(`${BACKEND_URL}/api/invites/pending`, {
    credentials: 'include',
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? 'Failed to fetch invites');
  }
  const data = await response.json() as { invites: SessionInvite[] };
  return data.invites;
}

export async function searchUsers(q: string): Promise<UserSearchResult[]> {
  const response = await fetch(`${BACKEND_URL}/api/friends/search?q=${encodeURIComponent(q)}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Search failed');
  const data = await response.json() as { users: UserSearchResult[] };
  return data.users;
}

export async function sendFriendRequest(addresseeId: string): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/friends/request`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ addresseeId }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? 'Failed to send friend request');
  }
}

export async function getPendingFriendRequests(): Promise<FriendRequest[]> {
  const response = await fetch(`${BACKEND_URL}/api/friends/requests`, { credentials: 'include' });
  if (!response.ok) throw new Error('Failed to fetch friend requests');
  const data = await response.json() as { requests: FriendRequest[] };
  return data.requests;
}

export async function respondToFriendRequest(id: number, action: 'accept' | 'decline'): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/friends/requests/${id}/respond`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? 'Failed to respond to friend request');
  }
}

export async function respondToInvite(
  id: number,
  action: 'accept' | 'decline'
): Promise<{ id: number; status: string; sessionCode: string }> {
  const response = await fetch(`${BACKEND_URL}/api/invites/${id}/respond`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw Object.assign(new Error(body.error ?? 'Failed to respond to invite'), {
      statusCode: response.status,
    });
  }
  return response.json() as Promise<{ id: number; status: string; sessionCode: string }>;
}
