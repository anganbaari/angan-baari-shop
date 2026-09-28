"use client";

import { useSyncExternalStore } from "react";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
}

const AUTH_KEY = "anganbaari.auth.v1";
const EMPTY_STATE: AuthState = { token: null, user: null };

// Same module-level-store + useSyncExternalStore pattern as lib/cart.ts, for
// the same reason: localStorage isn't available during SSR, so reading it in
// a mount effect would either mismatch hydration or need an extra render.
// Persisted as one object (not split token/user keys) so a read is always
// atomic — no window where a token exists without its user or vice versa.

let state: AuthState = EMPTY_STATE;
const listeners = new Set<() => void>();

function readStored(): AuthState {
  try {
    const raw = window.localStorage.getItem(AUTH_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.token === "string" && parsed.user) {
      return { token: parsed.token, user: parsed.user };
    }
    return EMPTY_STATE;
  } catch {
    return EMPTY_STATE;
  }
}

function persist() {
  try {
    if (state.token && state.user) {
      window.localStorage.setItem(AUTH_KEY, JSON.stringify(state));
    } else {
      window.localStorage.removeItem(AUTH_KEY);
    }
  } catch {
    /* private mode / quota — auth still works for this page session */
  }
}

function emit() {
  for (const listener of listeners) listener();
}

let hydrated = false;

function hydrateFromStorage() {
  if (hydrated) return;
  hydrated = true;
  state = readStored();
  emit();
}

function handleStorageEvent(event: StorageEvent) {
  if (event.key !== AUTH_KEY) return;
  state = readStored();
  emit();
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) {
    window.addEventListener("storage", handleStorageEvent);
  }
  listeners.add(listener);
  hydrateFromStorage();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("storage", handleStorageEvent);
    }
  };
}

const getSnapshot = () => state;
const getServerSnapshot = () => EMPTY_STATE;

// ─── Reads (safe to call outside React, e.g. from api.ts) ───────

export function getToken(): string | null {
  hydrateFromStorage();
  return state.token;
}

export function getUser(): AuthUser | null {
  hydrateFromStorage();
  return state.user;
}

export function isLoggedIn(): boolean {
  return getToken() !== null;
}

// ─── Mutators ─────────────────────────────────────────────────

export function login(token: string, user: AuthUser) {
  state = { token, user };
  hydrated = true;
  persist();
  emit();
}

/** Clears local state immediately (so the UI updates right away) and tells
 * the API to invalidate the token best-effort — logout must not hang on a
 * slow/failed network call, since there's nothing useful to show the user
 * if it fails; the token will simply age out unused server-side. */
export async function logout() {
  const token = state.token;
  state = EMPTY_STATE;
  persist();
  emit();

  if (!token) return;
  try {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://anganbaari.pythonanywhere.com/api/v1";
    await fetch(`${API_BASE_URL}/auth/logout/`, {
      method: "POST",
      headers: { Authorization: `Token ${token}` },
    });
  } catch {
    /* best-effort */
  }
}

export function useAuth() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    token: snapshot.token,
    user: snapshot.user,
    isLoggedIn: snapshot.token !== null,
    login,
    logout,
  };
}
