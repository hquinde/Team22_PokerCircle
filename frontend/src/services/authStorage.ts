/**
 * authStorage.ts
 *
 * Thin wrapper around expo-secure-store for persisting auth state across
 * app restarts. We store the user's ID and username so we can optimistically
 * render the Home screen while the /api/auth/me validation is in-flight, and
 * so logout can wipe the stored state.
 *
 * NOTE: We intentionally do NOT store the raw password. The session cookie
 * managed by the OS WebView/HTTP stack is the actual auth mechanism — this
 * store is purely a "did the user previously log in successfully?" signal.
 */

import * as SecureStore from 'expo-secure-store';

const KEY = 'pokercircle_auth';

export interface StoredAuth {
  userID: string;
  username: string;
  email: string;
}

export async function saveAuth(auth: StoredAuth): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(auth));
  } catch (err) {
    // Non-fatal — app still works, user just won't be persisted
    console.warn('authStorage: failed to save auth', err);
  }
}

export async function loadAuth(): Promise<StoredAuth | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch (err) {
    console.warn('authStorage: failed to load auth', err);
    return null;
  }
}

export async function clearAuth(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch (err) {
    console.warn('authStorage: failed to clear auth', err);
  }
}